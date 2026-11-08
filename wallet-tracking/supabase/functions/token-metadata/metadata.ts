// Pure provider logic: no user data, no display precision, no guessed token units.
export function technicalDecimals(value:any):number|null{
 if(typeof value!=='number'&&!(typeof value==='string'&&/^(0|[1-9][0-9]?)$/.test(value)))return null;
 const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=36?n:null;
}
export function metadataAddress(chain:any,value:any){
 const a=String(value||'').trim();if(a==='native')return a;
 if(chain.wallet_type==='evm'){if(!/^0x[0-9a-f]{40}$/i.test(a))throw Error('invalid-token-address');return a.toLowerCase()}
 if(chain.wallet_type==='tron'){if(!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a))throw Error('invalid-token-address');return a}
 if(chain.wallet_type==='sol'){if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a))throw Error('invalid-token-address');return a}
 if(chain.wallet_type==='akash'&&/^[A-Za-z][A-Za-z0-9/:._-]{1,127}$/.test(a))return a;
 throw Error('unsupported-token-platform');
}
export async function providerMetadata(chain:any,address:string,json:any,block:number|null=null){
 const chainKey=chain.chain_key;
 const url=(raw:string)=>{const u=new URL(raw);if(u.protocol!=='https:')throw Error('provider-url-invalid');return u.toString().replace(/\/$/,'')};
 const rpc=async(endpoint:string,method:string,params:any[])=>{
  const r=await json(url(endpoint),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:808,method,params})});
  if(r?.id!==808||r?.jsonrpc!=='2.0')throw Error('provider-response-invalid');
  if(r.error)throw Error(/revert/i.test(r.error.message||'')?'contract-call-reverted':'provider-rpc-error');
  if(!Object.hasOwn(r,'result'))throw Error('provider-response-incomplete');return r.result;
 };
 const verified=(decimals:number,source:string,kind:string,extra:any={})=>({status:'verified',decimals,source,kind,...extra});
 if(address==='native'){
  // Explicit units of currently supported protocols. No type-wide EVM default.
  const known:Record<string,[string,number]>={eth:['ETH',18],bsc:['BNB',18],matic:['POL',18],polygon:['POL',18],avalanche:['AVAX',18],avax:['AVAX',18],arbitrum:['ETH',18],arb:['ETH',18],optimism:['ETH',18],op:['ETH',18],base:['ETH',18],apertum:['APTM',18],btc:['BTC',8],bitcoin:['BTC',8],xrp:['XRP',6],ripple:['XRP',6],sol:['SOL',9],solana:['SOL',9],tron:['TRX',6],akash:['AKT',6]};
  const hit=known[chainKey];if(!hit||String(chain.native_symbol).toUpperCase()!==hit[0])throw Error('native-protocol-units-unconfigured');
  return verified(hit[1],'native-protocol-units','native',{symbol:hit[0]});
 }
 if(chainKey==='apertum'){
  let meta:any=null;
  try{const j=await json('https://explorer.apertum.io/api/v2/tokens/'+address);meta=j?.token||j}catch{}
  if(meta){
   const a=meta.address_hash??meta.address;const returned=typeof a==='object'?a?.hash:a;
   if(returned!=null&&String(returned).toLowerCase()!==address)throw Error('explorer-token-mismatch');
   if(meta.type!=null&&!['ERC-20','ERC20'].includes(meta.type))throw Error('unsupported-token-type');
   const d=technicalDecimals(meta.decimals);if(d!==null)return verified(d,'apertum-explorer-token-metadata','erc20',{symbol:meta.symbol||null,name:meta.name||null});
  }
 }
 if(chain.wallet_type==='evm'){
  if(!chain.rpc_url||!Number.isSafeInteger(Number(chain.evm_chain_id))||Number(chain.evm_chain_id)<=0)throw Error('evm-chain-config-incomplete');
  const endpoint=chain.rpc_url;const id=await rpc(endpoint,'eth_chainId',[]);
  if(typeof id!=='string'||!/^0x[0-9a-f]+$/i.test(id)||BigInt(id)!==BigInt(chain.evm_chain_id))throw Error('evm-chain-mismatch');
  const tag=block===null?'latest':'0x'+block.toString(16);
  const call=(data:string)=>rpc(endpoint,'eth_call',[{to:address,data},tag]);
  let raw:any;try{raw=await call('0x313ce567')}catch(e){if(String((e as Error).message)!=='contract-call-reverted')throw e;raw='0x'}
  if(raw==='0x'){
   // Only on-chain interface evidence marks a V3 pool; labels never do.
   const [slot,fee,t0,t1]=await Promise.all(['0x3850c7bd','0xddca3f43','0x0dfe1681','0xd21220a7'].map(call));
   const word=(x:any)=>typeof x==='string'&&/^0x[0-9a-f]{64}$/i.test(x);
   const addrWord=(x:any)=>word(x)&&/^0x0{24}[0-9a-f]{40}$/i.test(x)&&BigInt(x)>0n;
   if(typeof slot==='string'&&/^0x[0-9a-f]{448}$/i.test(slot)&&word(fee)&&BigInt(fee)>0n&&BigInt(fee)<1000000n&&addrWord(t0)&&addrWord(t1)&&t0.toLowerCase()!==t1.toLowerCase())
    return {status:'not_applicable',decimals:null,source:'evm-v3-pool-probe',kind:'v3_pool',reason:'pool-has-no-erc20-units'};
   throw Error('token-interface-not-proven');
  }
  if(typeof raw!=='string'||!/^0x[0-9a-f]{64}$/i.test(raw)||BigInt(raw)>36n)throw Error('technical-decimals-invalid');
  const decode=(hex:any)=>{
   if(typeof hex!=='string'||!/^0x[0-9a-f]+$/i.test(hex)||hex.length>2048)return null;
   try{let bytes=hex.slice(2);if(bytes.length>=128&&BigInt('0x'+bytes.slice(0,64))===32n){const n=Number(BigInt('0x'+bytes.slice(64,128)));if(n>200||bytes.length<128+n*2)return null;bytes=bytes.slice(128,128+n*2)}else if(bytes.length===64)bytes=bytes.replace(/(00)+$/,'');else return null;
    const s=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bytes.match(/../g)||[],v=>parseInt(v,16)));return /^[^\x00-\x1f\x7f]*$/.test(s)?s:null}catch{return null}
  };
  const names=await Promise.all(['0x95d89b41','0x06fdde03'].map(async selector=>{try{return decode(await call(selector))}catch{return null}}));
  return verified(Number(BigInt(raw)),'evm-decimals-call','erc20',{symbol:names[0],name:names[1]});
 }
 if(chain.wallet_type==='sol'){
  if(!chain.rpc_url)throw Error('solana-rpc-missing');
  const r=await rpc(chain.rpc_url,'getAccountInfo',[address,{encoding:'jsonParsed',commitment:'finalized'}]);const account=r?.value;
  const owners=['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
  const parsed=account?.data?.parsed,d=technicalDecimals(parsed?.info?.decimals);
  if(!account||!owners.includes(account.owner)||account.executable===true||parsed?.type!=='mint'||parsed?.info?.isInitialized!==true||d===null)throw Error('solana-mint-not-proven');
  return verified(d,'solana-mint-account','spl_mint');
 }
 if(chain.wallet_type==='tron'){
  if(!chain.balance_api_base)throw Error('tron-api-missing');
  const r=await json(url(chain.balance_api_base)+'/wallet/triggerconstantcontract',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({owner_address:address,contract_address:address,function_selector:'decimals()',visible:true})});
  const raw=r?.constant_result?.[0];if(r?.result?.result!==true||typeof raw!=='string'||! /^(0x)?[0-9a-f]{64}$/i.test(raw)||BigInt('0x'+raw.replace(/^0x/,''))>36n)throw Error('tron-decimals-not-proven');
  return verified(Number(BigInt('0x'+raw.replace(/^0x/,''))),'tron-constant-contract','trc20');
 }
 if(chain.wallet_type==='akash'){
  if(!chain.balance_api_base)throw Error('cosmos-api-missing');const r=await json(url(chain.balance_api_base)+'/cosmos/bank/v1beta1/denoms_metadata/'+encodeURIComponent(address));const m=r?.metadata;
  const base=m?.denom_units?.find((u:any)=>u.denom===m.base),display=m?.denom_units?.find((u:any)=>u.denom===m.display),d=technicalDecimals(display?.exponent);
  if(m?.base!==address||technicalDecimals(base?.exponent)!==0||d===null)throw Error('cosmos-metadata-incomplete');
  return verified(d,'cosmos-denom-metadata','cosmos_denom',{symbol:m.symbol||null,name:m.name||null});
 }
 throw Error('unsupported-token-platform');
}
