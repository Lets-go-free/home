import {createClient} from 'npm:@supabase/supabase-js@^2';
import {runProbe,validBody} from './probe.mjs';
const cors={'access-control-allow-origin':'https://www.letsgofree.me','access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS','cache-control':'no-store','vary':'Origin'};
Deno.serve(async req=>{
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
 if(req.headers.get('origin')!=='https://www.letsgofree.me')return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'POST required'},405);
 const bearer=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'');
 if(!bearer)return reply({error:'Authentication required'},401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key)return reply({error:'Configuration unavailable'},503);
 try {
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.getUser(bearer[1]);
  if(error||!data.user?.id)return reply({error:'Invalid session'},401);
 } catch{return reply({error:'Authentication unavailable'},503);}
 let body:unknown;try{body=await req.json();}catch{return reply({error:'Invalid JSON'},400);}
 if(!validBody(body))return reply({error:'Synthetic probe only'},400);
 return reply({mode:'synthetic-probe',results:await runProbe()});
});
