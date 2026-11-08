// Transaction-local negative evidence. Explorer completeness is explicitly scoped
// to its indexed response, never asserted as an independent on-chain zero proof.
const addr=(v:any)=>String(v?.hash||v?.address_hash||v||'').toLowerCase();
const validAddress=(v:string)=>/^0x[0-9a-f]{40}$/.test(v);
const rawValue=(v:any)=>{const s=String(v?.value??v??'');if(!/^\d+$/.test(s))throw Error('invalid-transfer-value');return BigInt(s)};
export async function inspectClaimPayoutCoverage(tx:any,address:string,readJson:(url:string)=>Promise<any>,base:string){
 const coverage:any={source:'blockscout-tx-v1',complete:false,transaction:false,
  token_transfers:false,internal_transactions:false,tx_hash:tx.tx_hash,
  block_number:Number(tx.block_number),token_count:0,internal_count:0,observed_incoming:false};
 try{
  if(!/^0x[0-9a-f]{64}$/.test(tx.tx_hash)||!validAddress(address)||
     !Number.isSafeInteger(coverage.block_number)||coverage.block_number<=0)throw Error('invalid-claim-context');
  const detail=await readJson(`${base}/transactions/${tx.tx_hash}`);
  const selector=String(detail.raw_input||detail.input||'').slice(0,10).toLowerCase();
  if(addr(detail.hash||detail.transaction_hash)!==tx.tx_hash||
     Number(detail.block_number)!==coverage.block_number||
     !['ok','success'].includes(String(detail.status||'').toLowerCase())||
     !['0x86bb8f37','0x19da4078'].includes(selector)||selector!==tx.selector||
     addr(detail.from)!==address||addr(detail.to)!==addr(tx.to_address)||!validAddress(addr(detail.to)))
   throw Error('claim-detail-mismatch');
  const topValue=rawValue(detail.value);
  if(addr(detail.to)===address&&topValue>0n)coverage.observed_incoming=true;
  coverage.transaction=true;
  for(const kind of ['token-transfers','internal-transactions']){
   const root=`${base}/transactions/${tx.tx_hash}/${kind}`;
   let url=root;const seen=new Set<string>();let pages=0;
   while(url){
    if(seen.has(url)||++pages>10)throw Error('transfer-pagination-incomplete');
    seen.add(url);const page=await readJson(url);
    if(!Array.isArray(page.items)||!Object.hasOwn(page,'next_page_params')||(!page.items.length&&page.next_page_params))throw Error('transfer-page-incomplete');
    for(const item of page.items){
     if(addr(item.transaction_hash||item.tx_hash)!==tx.tx_hash||
        (item.block_number!=null&&Number(item.block_number)!==coverage.block_number)||
        !validAddress(addr(item.from))||!validAddress(addr(item.to)))throw Error('transfer-context-incomplete');
     if(kind==='token-transfers'){
      coverage.token_count++;
      // NFTs, unknown types/contracts, missing decimals or malformed amounts are
      // not silently ignored. Even a proxy/unknown positive receipt blocks zero evidence.
      if(item.token?.type!=='ERC-20'||!validAddress(addr(item.token?.address_hash||item.token?.address))||
         item.token?.decimals==null||!Number.isInteger(Number(item.token.decimals))||
         Number(item.token.decimals)<0||Number(item.token.decimals)>36)throw Error('unknown-token-transfer');
      const value=rawValue(item.total?.value);
      if(addr(item.to)===address&&value>0n)coverage.observed_incoming=true;
     }else{
      coverage.internal_count++;
      const value=rawValue(item.value);
      // Unknown execution outcome is incomplete; failed traces cannot certify
      // completeness of a negative result. Keep them explicitly reviewable.
      if(item.error||item.success===false||!['ok','success'].includes(String(item.status||'').toLowerCase()))
       throw Error('internal-outcome-incomplete');
      if(addr(item.to)===address&&value>0n)coverage.observed_incoming=true;
     }
     if(coverage.token_count+coverage.internal_count>5000)throw Error('transfer-item-limit');
    }
    if(page.next_page_params==null){url='';break}
    if(typeof page.next_page_params!=='object'||Array.isArray(page.next_page_params)||!Object.keys(page.next_page_params).length)
     throw Error('transfer-cursor-invalid');
    const next=new URL(root);
    for(const [key,value] of Object.entries(page.next_page_params).sort(([a],[b])=>a.localeCompare(b)))
     if(value!=null)next.searchParams.set(key,String(value));
    url=next.toString();
   }
   coverage[kind==='token-transfers'?'token_transfers':'internal_transactions']=true;
  }
  coverage.complete=true;
  return {coverage,reason:coverage.observed_incoming?'incoming-transfer-needs-reconciliation':'complete-indexed-tx-without-payout-evidence'};
 }catch(e){
  // Do not persist arbitrary network messages/URLs (wallet addresses may occur).
  const known=['invalid-transfer-value','invalid-claim-context','claim-detail-mismatch','transfer-pagination-incomplete',
   'transfer-page-incomplete','transfer-context-incomplete','unknown-token-transfer','internal-outcome-incomplete',
   'transfer-item-limit','transfer-cursor-invalid'];
  const message=e instanceof Error?e.message:'';
  return {coverage,reason:known.includes(message)?message:'transaction-evidence-unavailable'};
 }
}
export function noPayoutEvidenceAllowed(coverage:any,flows:any[]){
 if(coverage?.complete!==true||coverage.transaction!==true||coverage.token_transfers!==true||
    coverage.internal_transactions!==true||coverage.observed_incoming!==false)return false;
 // Stored evidence can be newer than an Explorer response. Never discard it.
 return flows.every(f=>{
  if(!['eingang','ausgang','intern','sonst'].includes(f.direction))return false;
  if(f.direction!=='eingang'&&f.direction!=='intern')return true;
  return /^\d+$/.test(String(f.amount_raw??''))&&BigInt(f.amount_raw)===0n;
 });
}
