// Read-only strict Native Minter evidence for old claimReward (0x86bb8f37).
// This does not identify a mining NFT or authorize canonical claim creation.
export const NATIVE_MINTER_866='0x0200000000000000000000000000000000000001'
export const MINT_SELECTOR_866='0x4f5aaaba'
export const NATIVE_MINTED_TOPIC_866='0x400cd392f3d56fd10bb1dbd5839fdda8298208ddaa97b368faa053e1850930ee'
const hex=(s,n)=>typeof s==='string'&&new RegExp(`^0x[0-9a-fA-F]{${n}}$`).test(s)
const lower=s=>String(s||'').toLowerCase()
const addressTopic=s=>hex(s,64)&&/^0x0{24}[0-9a-f]{40}$/i.test(s)?'0x'+s.slice(-40).toLowerCase():null
const result=(status,reason,extra={})=>({status,reason,...extra})

export function verifyLegacyNativeMint866(trace,logs,walletAddress){
 const wallet=lower(walletAddress)
 if(!hex(wallet,40)||!Array.isArray(logs)||logs.length>1000||
    !trace||typeof trace!=='object')return result('needs_review','invalid-evidence-input')
 const mintCalls=[];let nodes=0,invalid=false
 const visit=(node,depth)=>{
  if(invalid)return
  if(depth>24||++nodes>3000||!node||typeof node!=='object'){invalid=true;return}
  if(lower(node.to)===NATIVE_MINTER_866){
   if(lower(node.type)!=='call'||typeof node.input!=='string'||
      !node.input.toLowerCase().startsWith(MINT_SELECTOR_866)||node.error||node.revertReason){
    invalid=true;return
   }
   const input=node.input.toLowerCase()
   if(!/^0x[0-9a-f]{136}$/.test(input)){invalid=true;return}
   const recipient=addressTopic('0x'+input.slice(10,74))
   const amount=BigInt('0x'+input.slice(74,138))
   if(recipient!==wallet||amount<=0n||!hex(lower(node.from),40)){invalid=true;return}
   mintCalls.push({sender:lower(node.from),recipient,amount})
  }
  if(node.calls!==undefined){
   if(!Array.isArray(node.calls)){invalid=true;return}
   for(const child of node.calls)visit(child,depth+1)
  }
 }
 if(Array.isArray(trace)){for(const item of trace)visit(item,0)}
 else visit(trace,0)
 if(invalid)return result('needs_review','incomplete-or-ambiguous-trace')
 const events=[],indices=new Set()
 for(const log of logs){
  if(lower(log?.address?.hash||log?.address_hash||log?.address) !==NATIVE_MINTER_866)continue
  if(lower(log?.topics?.[0])!==NATIVE_MINTED_TOPIC_866)continue
  const t=log.topics
  // Blockscout v2 pads the three indexed NativeCoinMinted topics with
  // a fourth, null entry. Accept only that exact harmless padding.
  const validTopics=t.length===3||(t.length===4&&t[3]===null)
  if(!validTopics||!hex(t[1],64)||!hex(t[2],64)||!hex(log.data,64))
   return result('needs_review','invalid-mint-event')
  const index=log.index??log.log_index
  if(index!=null){
   if(!/^(0|[1-9][0-9]*)$/.test(String(index))||indices.has(String(index)))
    return result('needs_review','duplicate-or-invalid-mint-log-index')
   indices.add(String(index))
  }
  const sender=addressTopic(t[1]),recipient=addressTopic(t[2]),amount=BigInt(log.data)
  if(!sender||!recipient||amount<=0n)return result('needs_review','invalid-mint-event')
  if(recipient===wallet)events.push({sender,recipient,amount})
 }
 if(!mintCalls.length&&events.length)return result('needs_review','mint-event-without-trace')
 if(!mintCalls.length)return result('no_evidence','no-native-minter-call')
 const a=mintCalls.map(c=>`${c.sender}:${c.recipient}:${c.amount}`).sort()
 const b=events.map(c=>`${c.sender}:${c.recipient}:${c.amount}`).sort()
 if(a.length!==b.length||a.some((v,i)=>v!==b[i]))
  return result('needs_review','mint-call-event-mismatch',{traceCalls:mintCalls.length,mintEvents:events.length})
 const amount=mintCalls.reduce((sum,c)=>sum+c.amount,0n)
 return result('verified','matched-native-minter-call-and-event',{
  amountRaw:amount.toString(),amountAptm:`${amount/1000000000000000000n}.${String(amount%1000000000000000000n).padStart(18,'0')}`,
  mintCalls:mintCalls.length,mintEvents:events.length,asset:'native',decimals:18
 })
}
