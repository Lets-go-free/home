import {createClient} from 'npm:@supabase/supabase-js@^2';
import {valid,relay} from './relay.mjs';
const origin='https://www.letsgofree.me';
const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS','cache-control':'no-store','vary':'Origin'};
Deno.serve(async req=>{
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(req.headers.get('origin')!==origin)return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'POST required'},405);
 const bearer=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'');
 if(!bearer)return reply({error:'Authentication required'},401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key)return reply({error:'Configuration unavailable'},503);
 try{const {data,error}=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).auth.getUser(bearer[1]);if(error||!data.user?.id)return reply({error:'Invalid session'},401);}catch{return reply({error:'Authentication unavailable'},503);}
 let body;try{const raw=await req.text();if(raw.length>4096)return reply({error:'Invalid request'},400);body=JSON.parse(raw);}catch{return reply({error:'Invalid request'},400);}
 if(!valid(body))return reply({error:'Invalid request'},400);
 return reply(await relay(body));
});
