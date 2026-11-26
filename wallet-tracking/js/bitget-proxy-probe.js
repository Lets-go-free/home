(()=>{
 'use strict';
 const button=document.getElementById('bitgetProxyProbe'),out=document.getElementById('bitgetProxyProbeResult');
 if(!button||!out)return;
 button.addEventListener('click',async()=>{
  button.disabled=true;out.textContent='Server-Test läuft – ausschliesslich Platzhalterdaten.';
  try {
   const {data:sessionData}=await sb.auth.getSession();
   if(!sessionData?.session){out.textContent='Bitte zuerst anmelden.';return;}
   const {data,error}=await sb.functions.invoke('bitget-probe',{body:{mode:'synthetic-probe'}});
   if(error||data?.mode!=='synthetic-probe'||!Array.isArray(data.results)){out.textContent='Edge-Test fehlgeschlagen. Deployment, Anmeldung und Netzwerk prüfen.';return;}
   const labels={public:'Öffentliche API',classic:'Classic Konto',uta:'UTA Konto'};
   out.textContent=data.results.map(r=>`${labels[r.name]||'Unbekannt'}: ${r.http===null?'Keine Antwort':`HTTP ${r.http}, Bitget ${r.code||'kein Code'}`}`).join('\n')+'\nLesbare API-Fehler zeigen Server-Erreichbarkeit, nicht erfolgreiche Authentifizierung.';
  }catch{out.textContent='Edge-Test fehlgeschlagen.';}finally{button.disabled=false;}
 });
})();
