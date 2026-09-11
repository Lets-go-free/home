import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPLORER_API = "https://explorer.apertum.io/api/v2";
const FRESH_MS = 24 * 60 * 60 * 1000;
const MAX_IDS = 100;
const CONCURRENCY = 8;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
function lower(v: unknown){ return String(v ?? "").toLowerCase(); }
function hashOf(v: any){ return String(v?.hash ?? v ?? ""); }

function tokenIdOf(t: any): string {
  const total=t?.total;
  const id=total?.token_id ?? total?.id ?? t?.token_id ?? t?.token_instance?.id;
  if(id!=null)return String(id);
  if(Array.isArray(t?.token_ids)&&t.token_ids.length===1)return String(t.token_ids[0]);
  return "";
}
function nextUrl(initial: string, params: any){
  if(!params || typeof params!=="object")return null;
  const q=new URLSearchParams();
  for(const [k,v] of Object.entries(params))if(v!=null)q.set(k,String(v));
  return q.toString()?`${initial}?${q.toString()}`:null;
}

async function fetchInstanceHistory(contract: string,id: string){
  const initial=`${EXPLORER_API}/tokens/${contract}/instances/${id}/transfers`;
  let url:string|null=initial;
  const out:any[]=[];
  let pages=0;
  while(url && pages<100){
    pages++;
    const res=await fetch(url,{headers:{"Accept":"application/json"}});
    if(!res.ok)throw new Error(`Explorer HTTP ${res.status} for #${id}`);
    const data=await res.json();
    for(const t of (data?.items||[])){
      const tid=tokenIdOf(t);
      if(tid && tid!==id)continue;
      out.push({
        chain_key:"apertum",
        nft_contract:contract,
        nft_id:Number(id),
        tx_hash:lower(t?.transaction_hash ?? t?.tx_hash ?? hashOf(t?.transaction)),
        log_index:Number(t?.log_index ?? 0),
        block_number:Number(t?.block_number ?? 0),
        block_timestamp:t?.timestamp ?? t?.block_timestamp ?? null,
        from_address:lower(hashOf(t?.from)),
        to_address:lower(hashOf(t?.to)),
        source:"blockscout-instance"
      });
    }
    url=nextUrl(initial,data?.next_page_params);
  }
  out.sort((a,b)=>a.block_number-b.block_number||a.log_index-b.log_index);
  return out;
}

async function pool<T,R>(items:T[],limit:number,fn:(x:T)=>Promise<R>){
  const out:R[]=[];
  let cursor=0;
  async function worker(){
    while(true){
      const i=cursor++;
      if(i>=items.length)return;
      out[i]=await fn(items[i]);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));
  return out;
}

Deno.serve(async (req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({ok:false,error:"Method not allowed"},405);

  const started=Date.now();
  try{
    const auth=req.headers.get("Authorization")||"";
    if(!auth.startsWith("Bearer "))return json({ok:false,error:"Unauthorized"},401);

    const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
    const anonKey=Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller JWT.
    const caller=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await caller.auth.getUser();
    if(userError||!user)return json({ok:false,error:"Unauthorized"},401);

    const admin=createClient(supabaseUrl,serviceKey);
    const body=await req.json().catch(()=>({}));
    const contract=lower(body?.contract);
    const ids=[...new Set((Array.isArray(body?.token_ids)?body.token_ids:[]).map((x:any)=>String(x)))]
      .filter((x:string)=>/^\d+$/.test(x));

    if(!/^0x[0-9a-f]{40}$/.test(contract))return json({ok:false,error:"Invalid contract"},400);
    if(!ids.length||ids.length>MAX_IDS)return json({ok:false,error:`token_ids must contain 1-${MAX_IDS} numeric IDs`},400);

    const numericIds=ids.map(Number);
    const {data:coverage,error:covErr}=await admin.from("apertum_nft_history_coverage")
      .select("*").eq("chain_key","apertum").eq("nft_contract",contract).in("nft_id",numericIds);
    if(covErr)throw covErr;

    const covMap=new Map((coverage||[]).map((r:any)=>[String(r.nft_id),r]));
    const now=Date.now();
    const refreshIds=ids.filter(id=>{
      const c:any=covMap.get(id);
      const age=c?.checked_at?now-new Date(c.checked_at).getTime():Infinity;
      return !c?.is_complete || age>FRESH_MS;
    });

    const histories=await pool(refreshIds,CONCURRENCY,async(id)=>{
      try{return {id,rows:await fetchInstanceHistory(contract,id),ok:true};}
      catch(e){return {id,rows:[],ok:false,error:e instanceof Error?e.message:String(e)};}
    });

    let refreshed=0;
    for(const h of histories){
      if(!h.ok)continue; // Never mark failed explorer reads as complete.
      refreshed++;
      // Replace only this NFT's public cache atomically enough for immutable history.
      const {error:delErr}=await admin.from("apertum_nft_transfer_cache")
        .delete().eq("chain_key","apertum").eq("nft_contract",contract).eq("nft_id",Number(h.id));
      if(delErr)throw delErr;
      if(h.rows.length){
        const {error:insErr}=await admin.from("apertum_nft_transfer_cache").insert(h.rows);
        if(insErr)throw insErr;
      }
      const {error:upErr}=await admin.from("apertum_nft_history_coverage").upsert({
        chain_key:"apertum",nft_contract:contract,nft_id:Number(h.id),
        is_complete:true,transfer_count:h.rows.length,checked_at:new Date().toISOString(),
        source:"blockscout-instance"
      },{onConflict:"chain_key,nft_contract,nft_id"});
      if(upErr)throw upErr;
    }

    const {data:rows,error:rowsErr}=await admin.from("apertum_nft_transfer_cache")
      .select("*").eq("chain_key","apertum").eq("nft_contract",contract)
      .in("nft_id",numericIds).order("block_number",{ascending:true}).order("log_index",{ascending:true});
    if(rowsErr)throw rowsErr;

    return json({
      ok:true,
      transfers:rows||[],
      cache_hits:ids.length-refreshIds.length,
      refreshed,
      failed:histories.filter(h=>!h.ok).map(h=>({nft_id:h.id,error:h.error})),
      duration_ms:Date.now()-started
    });
  }catch(e){
    return json({ok:false,error:e instanceof Error?e.message:String(e)},500);
  }
});
