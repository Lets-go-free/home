import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'

const source=readFileSync(new URL('../admin/dao-legacy-mint-drain-869.js',import.meta.url),'utf8')
const mode='admin-legacy-native-mint-preview-866'
const wallet='8a3c5dc6-0610-482d-a327-3f3ba03db158'
const makeRun=(alter)=>{
 const nodes=new Map();const calls=[]
 const getNode=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,style:{}})
  return nodes.get(id)
 }
 const window={isSecureContext:true,navigator:{onLine:true},confirm:()=>true,addEventListener:()=>{}}
 const sb={auth:{getSession:async()=>({data:{session:{access_token:'test'}},error:null})},functions:{invoke:async(_name,{body})=>{
  calls.push(body)
  const count=body.offset===75?1:5
  const data={ok:true,mode,proofBuild:'868-field-diagnostics',walletId:wallet,offset:body.offset,
   selected:count,checked:count,nextOffset:body.offset+count,hasMore:body.offset+count<76,
   stopped:'completed',claimsCreated:0,
   results:Array.from({length:count},()=>({status:'verified',reason:'matched-native-minter-call-and-event',
     amountRaw:'1000000000000000000',mintCalls:1,mintEvents:1,asset:'native',decimals:18}))}
  return {data:alter?.(data,calls.length)||data,error:null}
 }}}
 const context={window,document:{getElementById:getNode},sb,isAdmin:true,currentUser:{id:'admin-user'},console}
 vm.runInNewContext(source,context)
 return {start:window.startDaoLegacyMintDrain869,nodes,calls}
}

{
 const run=makeRun()
 await run.start()
 assert.equal(run.calls.length,10)
 assert.deepEqual(Array.from(run.calls,x=>x.offset),[30,35,40,45,50,55,60,65,70,75])
 assert.match(run.nodes.get('daoLegacyMintDrainStatus').textContent,/76 von 76 verifiziert/)
 assert.match(run.nodes.get('daoLegacyMintDrainStatus').textContent,/136\.576417951299766898 APTM/)
 assert.equal(run.nodes.get('daoLegacyMintDrainStart').disabled,false)
}
{
 const run=makeRun((data,n)=>n===3?{...data,results:[{...data.results[0],status:'needs_review'},...data.results.slice(1)]}:data)
 await run.start()
 assert.equal(run.calls.length,3)
 assert.match(run.nodes.get('daoLegacyMintDrainStatus').textContent,/Sofort gestoppt/)
 assert.match(run.nodes.get('daoLegacyMintDrainStatus').textContent,/10/)
}
console.log('8.69 browser drain: sequential 46 verified, stops on first error')
