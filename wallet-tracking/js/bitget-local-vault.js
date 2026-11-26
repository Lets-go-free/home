/* Local-only encrypted credentials. No networking. */
(function(root){
'use strict';
const enc=new TextEncoder(),dec=new TextDecoder(), rounds=600000;
const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
async function derive(password,salt){const base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:rounds},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
const aad=(uid,id)=>enc.encode(JSON.stringify(['WalletTracking/Bitget/v1',uid,id]));
async function seal(uid,id,password,credentials){if(password.length<12)throw Error('password');const salt=bytes(16),iv=bytes(12),key=await derive(password,salt);const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(uid,id)},key,enc.encode(JSON.stringify(credentials)));return {version:1,salt,iv,cipher};}
async function open(uid,id,password,record){if(record.version!==1)throw Error('version');const key=await derive(password,record.salt);const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:aad(uid,id)},key,record.cipher);return JSON.parse(dec.decode(plain));}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('wt-bitget-local-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('accounts',{keyPath:['uid','id']});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('blocked'));});}
async function tx(mode,fn){const d=await db();try{return await new Promise((resolve,reject)=>{const t=d.transaction('accounts',mode),r=fn(t.objectStore('accounts'));t.oncomplete=()=>resolve(r.result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}finally{d.close();}}
const list=async uid=>(await tx('readonly',s=>s.getAll())).filter(x=>x.uid===uid);
const put=record=>tx('readwrite',s=>s.put(record));
const remove=(uid,id)=>tx('readwrite',s=>s.delete([uid,id]));
root.WTBitgetVault={seal,open,list,put,remove};
})(globalThis);
