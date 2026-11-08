// One contract-based asset policy shared by the browser and DAO worker.
// Decimals are technical on-chain evidence; this registry never guesses them.
(function(root){
 const definitions=Object.freeze({
  native:Object.freeze({symbol:'APTM',kind:'aptm',native:true}),
  '0x110ac02ba3384bc055c13a87766049a74517beda':Object.freeze({symbol:'wAPTM',kind:'aptm',native:false}),
  '0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f':Object.freeze({symbol:'wUSDT',kind:'stable',native:false}),
  '0xd979f41e12a69aa82f04866444ea91e8e8faefd9':Object.freeze({symbol:'wUSDC',kind:'stable',native:false})
 });
 function asset(address){const key=String(address||'').toLowerCase();return Object.hasOwn(definitions,key)?definitions[key]:null;}
 function fixedQuote(address){
  return asset(address)?.kind==='stable'?Object.freeze({price:1,source:'Stablecoin-Parität · 1 USD'}):null;
 }
 function technicalDecimals(value){
  if(typeof value!=='number'&&!(typeof value==='string'&&/^(0|[1-9][0-9]?)$/.test(value)))return null;
  const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=36?n:null;
 }
 root.WTDaoAssetPolicy=Object.freeze({asset,fixedQuote,technicalDecimals});
})(globalThis);
