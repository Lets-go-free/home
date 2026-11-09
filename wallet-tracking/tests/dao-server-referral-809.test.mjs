import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const src=fs.readFileSync(new URL('../supabase/functions/dao-reward-refresh/index.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('worker.ts',src,ts.ScriptTarget.Latest,true);
const wanted=new Set(['verifiedReferralSummary','addDecimalStrings','isVerifiedReferralTransaction','lower']);
const nodes=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&wanted.has(n.name?.text));
assert.equal(nodes.length,wanted.size);
const text=nodes.map(n=>src.slice(n.pos,n.end)).join('\n');
const compiled=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const contract='0xcd40d3bcfc29c51edb1fdd78580578362366f856';
const token='0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f';
const wallet='0x239c5822a0d2a67e629d7a3b5c8180721e228b47';
const txs=[
 {id:1,tx_hash:'0x01',to_address:contract,method:'withdraw',selector:'0x2e1a7d4d',claim_nft_subtype:null},
 {id:2,tx_hash:'0x02',to_address:contract,method:'withdraw',selector:'0x2e1a7d4d',claim_nft_subtype:null},
 {id:3,tx_hash:'0x03',to_address:'0xother',method:'swapExactETHForTokens',selector:'0x00',claim_nft_subtype:null},
 {id:4,tx_hash:'0x04',to_address:contract,method:'withdraw',selector:'0x2e1a7d4d',claim_nft_subtype:null},
 {id:5,tx_hash:'0x05',to_address:'0xother',method:'claim',selector:'0x86bb8f37',claim_nft_subtype:'DID'},
];
const flows=[
 {flow_key:'a',tx_hash:'0x01',direction:'eingang',token_address:token,counterparty_address:contract,token_symbol:'wUSDT',amount:'100',value_usd:'100'},
 {flow_key:'b',tx_hash:'0x02',direction:'eingang',token_address:token,counterparty_address:contract,token_symbol:'wUSDT',amount:'2.25',value_usd:'2.25'},
 {flow_key:'c',tx_hash:'0x03',direction:'eingang',token_address:token,counterparty_address:contract,token_symbol:'wUSDT',amount:'900',value_usd:'900'},
 {flow_key:'d',tx_hash:'0x04',direction:'eingang',token_address:token,counterparty_address:'0xnotcontract',token_symbol:'wUSDT',amount:'900',value_usd:'900'},
 {flow_key:'e',tx_hash:'0x05',direction:'eingang',token_address:'native',counterparty_address:'0xother',token_symbol:'APTM',amount:'0.000000000000000001',value_usd:null},
];
function query(table){
 const filters=[];let hashes=null;let offset=[0,Infinity];
 const q={select(){return q},eq(k,v){filters.push([k,v]);return q},in(k,v){if(k==='tx_hash')hashes=v;return q},order(){return q},range(a,b){offset=[a,b];return Promise.resolve({data:txs.filter(t=>filters.every(([k,v])=>t[k]===undefined||t[k]===v)).slice(a,b+1),error:null})},limit(n){return Promise.resolve({data:flows.filter(f=>hashes.includes(f.tx_hash)&&filters.every(([k,v])=>f[k]===undefined||f[k]===v)).slice(0,n),error:null})}};
 return q;
}
const context={sb:{from:query},REFERRAL_WALLET:wallet,REFERRAL_REWARD_CONTRACT:contract,REFERRAL_WUSDT_TOKEN:token,CLAIM_SELECTOR:'0x86bb8f37',NEW_MINER_CLAIM_SELECTOR:'0x19da4078',PROJECT:'dao1',CHAIN:'apertum'};
vm.runInNewContext(compiled+'\nthis.summarize=verifiedReferralSummary;this.add=addDecimalStrings;',context);
test('confirmed contract withdrawals and DID are classified; swaps and unrelated flows excluded',async()=>{
 const result=await context.summarize({user_id:'test',wallet_id:'test'},wallet);
 assert.equal(result.verifiedTransactions,3);
 assert.equal(result.verifiedFlows,3);
 assert.equal(result.byAsset.find(a=>a.symbol==='wUSDT')?.amount,'102.25');
 assert.equal(result.byAsset.find(a=>a.symbol==='APTM')?.amount,'0.000000000000000001');
});
test('another wallet is never classified',async()=>{
 const result=await context.summarize({user_id:'test',wallet_id:'test'},'0xother');
 assert.equal(result.verifiedFlows,0);
});
test('arbitrary precision decimal sum',()=>{
 assert.equal(context.add('99999999999999999999.999999999999999999','0.000000000000000001'),'100000000000000000000.000000000000000000');
});
test('NFT audit and referral audit remain admin protected and read-only',()=>{
 for(const mode of ['audit-referrals-test-wallet','audit-nft-candidates-test-wallet']){
  const location=src.indexOf(`if(body?.mode==='${mode}')`);
  assert.ok(location>0);
  assert.match(src.slice(location,location+300),/authenticateInspectAdmin\(request\)/);
 }
});
