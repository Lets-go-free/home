import test from 'node:test'
import assert from 'node:assert/strict'
import {previewExactPriceAtBlock873} from '../supabase/functions/dao-reward-refresh/price-target-worker.ts'

const word=n=>BigInt(n).toString(16).padStart(64,'0')
const token0='0x110ac02ba3384bc055c13a87766049a74517beda'
const token1='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f'
const wrapped=s=>'0x'+s.slice(2).padStart(64,'0')
const reserve='0x'+word(100n*10n**18n)+word(20n*10n**6n)+word(0)
const sb={from(table){
 assert.equal(table,'chains')
 return {select(){return {eq(){return {async single(){return {data:{rpc_url:'https://rpc.apertum.io',evm_chain_id:2786},error:null}}}}}}}
}}
async function withRpc(responder,callback){
 const original=globalThis.fetch
 globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://rpc.apertum.io/')
  const request=JSON.parse(options.body)
  const result=await responder(request.method,request.params)
  return {ok:true,async json(){return {jsonrpc:'2.0',id:request.id,result}}}
 }
 try{return await callback()}finally{globalThis.fetch=original}
}
const basics=(method,params)=>{
 if(method==='eth_chainId')return '0xae2'
 if(method==='eth_call'){
  if(params[0].data==='0x0dfe1681')return wrapped(token0)
  if(params[0].data==='0xd21220a7')return wrapped(token1)
  if(params[0].data==='0x313ce567')return '0x'+word(params[0].to.toLowerCase()===token0?18:6)
 }
 return null
}
test('old claims remain strictly unpriced, without RPC',async()=>{
 const result=await previewExactPriceAtBlock873({},40707)
 assert.equal(result.status,'unpriced_before_exact_anchor')
 assert.equal(result.priceUsd,null)
})
test('archive pool state proves exact target price without a database write',async()=>{
 let usedSync=false
 const result=await withRpc((method,params)=>{
  const common=basics(method,params);if(common!==null)return common
  if(method==='eth_call'&&params[0].data==='0x0902f1ac'){
   assert.equal(params[1],'0x'+(957942).toString(16));return reserve
  }
  if(method==='eth_getLogs')usedSync=true
  throw Error('Unexpected RPC '+method)
 },()=>previewExactPriceAtBlock873(sb,957942))
 assert.equal(result.status,'exact_v13_verified')
 assert.equal(result.source,'historical-pool-state')
 assert.equal(result.proofBlock,957942)
 assert.ok(Math.abs(result.priceUsd-0.2)<1e-12)
 assert.equal(usedSync,false)
})
test('archive miss uses verified predecessor Sync, never neighbouring cached price',async()=>{
 const syncBlock=957900
 const result=await withRpc((method,params)=>{
  const common=basics(method,params);if(common!==null)return common
  if(method==='eth_call'&&params[0].data==='0x0902f1ac')throw Error('archive unavailable')
  if(method==='eth_getLogs')return [{address:'0x38acbfa5108d3c76d6cea4d380182e832a289b57',
   topics:['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'],
   transactionHash:'0x'+'ab'.repeat(32),blockNumber:'0x'+syncBlock.toString(16),
   logIndex:'0x1',data:reserve}]
  throw Error('Unexpected RPC '+method)
 },()=>previewExactPriceAtBlock873(sb,957942))
 assert.equal(result.status,'exact_v13_verified')
 assert.equal(result.source,'verified-predecessor-sync')
 assert.equal(result.proofBlock,syncBlock)
 assert.ok(result.priceUsd>0)
})
