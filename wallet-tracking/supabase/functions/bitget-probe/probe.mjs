// Fixed synthetic probe only. Never accepts or forwards user credentials.
const paths=[['public','/api/v2/public/time'],['classic','/api/v2/spot/account/info'],['uta','/api/v3/account/info']];
export async function runProbe(fetcher=fetch){
 return Promise.all(paths.map(async ([name,path])=>{
  try {
   const headers=name==='public'?{}:{'ACCESS-KEY':'wallettracking-invalid-test-key','ACCESS-SIGN':'invalid-test-signature','ACCESS-TIMESTAMP':String(Date.now()),'ACCESS-PASSPHRASE':'invalid-test-passphrase','Content-Type':'application/json','locale':'en-US'};
   const r=await fetcher('https://api.bitget.com'+path,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(10000)});
   let code=null; try {const j=await r.json(); if(/^\d{5}$/.test(String(j.code))) code=String(j.code);}catch{}
   return {name,http:r.status,code};
  }catch{return {name,http:null,code:null};}
 }));
}
export function validBody(body){return !!body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).length===1 && body.mode==='synthetic-probe';}
