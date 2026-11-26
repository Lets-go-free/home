(()=>{
'use strict';
const paths=Object.freeze({utaInfo:'/api/v3/account/info',classicInfo:'/api/v2/spot/account/info',utaAssets:'/api/v3/account/assets',spot:'/api/v2/spot/account/assets?assetType=hold_only',usdt:'/api/v2/mix/account/accounts?productType=USDT-FUTURES',usdc:'/api/v2/mix/account/accounts?productType=USDC-FUTURES',coin:'/api/v2/mix/account/accounts?productType=COIN-FUTURES',cross:'/api/v2/margin/crossed/account/assets',isolated:'/api/v2/margin/isolated/account/assets'});
const form=document.getElementById('bitgetLiveForm'), out=document.getElementById('bitgetLiveResult'), toggle=document.getElementById('bitgetLiveOpen');
if(!form||!out||!toggle)return;
toggle.addEventListener('click',()=>{form.hidden=!form.hidden;});
const enc=new TextEncoder();
form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button');if(btn.disabled)return;btn.disabled=true;out.textContent='Verbindung wird geprüft …';
let key=form.elements.apiKey.value,secret=form.elements.apiSecret.value,phrase=form.elements.apiPhrase.value;form.reset();
try{const {data:s}=await sb.auth.getSession();const uid=s?.session?.user?.id;if(!uid)throw new Error();
const hmac=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);secret='';
const call=async operation=>{const {data:current}=await sb.auth.getSession();if(current?.session?.user?.id!==uid)throw new Error();const timestamp=String(Date.now());const signature=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',hmac,enc.encode(timestamp+'GET'+paths[operation])))));const {data,error}=await sb.functions.invoke('bitget-relay',{body:{operation,key,phrase,timestamp,signature}});if(error||!data)throw new Error();return data;};
let info=await call('utaInfo'), type='UTA';if(info.http===400&&info.code==='40084'){info=await call('classicInfo');type='Classic';}
if(info.http!==200||info.code!=='00000'||info.readOnly!==true){out.textContent='Schreibschutz nicht bestätigt; abgebrochen. HTTP '+(info.http??'–')+', Bitget '+(info.code??'–');return;}
out.textContent=type+' – Read-only bestätigt.\n';const ops=type==='UTA'?['utaAssets']:['spot','usdt','usdc','coin','cross','isolated'];let ok=0;
for(const op of ops){const r=await call(op);if(r.http===200&&r.code==='00000'&&Array.isArray(r.rows)){ok++;out.textContent+=op+': '+r.rows.length+' Datensätze\n'+JSON.stringify(r.rows,null,2)+'\n';}else out.textContent+=op+': Fehler '+(r.code??'–')+'\n';}
out.textContent+='Verbindung: '+ok+'/'+ops.length+' Abfragen erfolgreich. Keine dauerhafte Speicherung.';
}catch{out.textContent+='\nVerbindung fehlgeschlagen. Anmeldung, Deployment, Netzwerk und Bitget-IP-Freigabe prüfen.';}finally{key=secret=phrase='';btn.disabled=false;}
});
})();
