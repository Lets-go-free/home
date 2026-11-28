import { createClient } from 'npm:@supabase/supabase-js@^2';
const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const secret=Deno.env.get('TLN_REWARD_CRON_SECRET')||'',access=Deno.env.get('ALCHEMY_USAGE_ACCESS_KEY')||'';
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
function authorized(value:string){if(!secret||value.length!==secret.length)return false;let d=0;for(let i=0;i<secret.length;i++)d|=secret.charCodeAt(i)^value.charCodeAt(i);return d===0;}
Deno.serve(async req=>{
 if(req.method!=='POST'||!authorized(req.headers.get('x-tln-reward-secret')||''))return reply({ok:false,error:'unauthorized'},403);
 if(!url||!key||!access)return reply({ok:false,error:'usage-access-not-configured'},503);
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);
 try{
  const res=await fetch('https://admin-api.alchemy.com/v1/usage/summary',{headers:{Authorization:`Bearer ${access}`},signal:c.signal});
  if(!res.ok)return reply({ok:false,error:'usage-provider-unavailable',providerStatus:res.status},503);
  const {data}=await res.json(); const u=data?.usageLimit,p=data?.billingPeriod,f=data?.freshness;
  const number=(v:unknown)=>typeof v==='number'||(typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v))?Number(v):NaN;
  const values=[u?.limit,u?.used,u?.remaining,u?.percentUsed].map(number);
  if(u?.unit!=='CU'||!values.every(Number.isFinite)||!p?.startTime||!p?.endTime||!f?.dataThrough)return reply({ok:false,error:'invalid-usage-summary'},502);
  const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:result,error}=await sb.rpc('wallettracking_alchemy_usage_1028',{p_start:p.startTime,p_end:p.endTime,p_through:f.dataThrough,p_limit:values[0],p_used:values[1],p_remaining:values[2],p_percent:values[3]});
  if(error||!result)return reply({ok:false,error:'usage-persistence-failed'},503);
  return reply({ok:true,...result});
 }catch{return reply({ok:false,error:'usage-check-failed'},503)}finally{clearTimeout(timer)}
});
