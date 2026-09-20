// Phase 5.59: Browser-Graphcache unterstützt Ancestor-/Upline-Lesen entlang parentKey.
// WalletTracking · zentraler persistenter Browser-Cache (IndexedDB)
// Schemaoffen: Payloads werden als vollständige Objekte gespeichert. DB-Spalten dürfen
// ergänzt werden, ohne dass dafür das IndexedDB-Schema geändert werden muss.
(() => {
  const DB_NAME="wallet_tracking_cache";
  const DB_VERSION=2;
  const ITEM_STORE="items";
  const META_STORE="meta";
  let dbPromise=null;

  function openDb(){
    if(!("indexedDB" in window))return Promise.reject(new Error("IndexedDB nicht verfügbar"));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(ITEM_STORE)){
          const s=db.createObjectStore(ITEM_STORE,{keyPath:["namespace","cacheKey","itemKey"]});
          s.createIndex("cache",["namespace","cacheKey"],{unique:false});
          s.createIndex("cacheParent",["namespace","cacheKey","parentKey"],{unique:false});
        }
        if(db.objectStoreNames.contains(ITEM_STORE)){const s=req.transaction.objectStore(ITEM_STORE);if(!s.indexNames.contains("cacheParent"))s.createIndex("cacheParent",["namespace","cacheKey","parentKey"],{unique:false});}
        if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:["namespace","cacheKey"]});
      };
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }
  const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  const txDone=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error("IndexedDB Transaktion abgebrochen"));});

  async function getMeta(namespace,cacheKey){const db=await openDb(),tx=db.transaction(META_STORE,"readonly");return (await request(tx.objectStore(META_STORE).get([namespace,cacheKey])))||null;}
  async function getAll(namespace,cacheKey){
    const db=await openDb(),tx=db.transaction(ITEM_STORE,"readonly"),idx=tx.objectStore(ITEM_STORE).index("cache");
    const rows=await request(idx.getAll(IDBKeyRange.only([namespace,cacheKey])));
    return rows.map(r=>r.payload); // payload blijft absichtlich schemaoffen/vollständig.
  }
  async function getByKeys(namespace,cacheKey,itemKeys){
    const db=await openDb(),tx=db.transaction(ITEM_STORE,"readonly"),store=tx.objectStore(ITEM_STORE);
    const out=[];for(const k of itemKeys||[]){const r=await request(store.get([namespace,cacheKey,String(k)]));if(r)out.push(r.payload);}
    return out;
  }
  async function getDescendants(namespace,cacheKey,rootKeys,{maxDepth=20}={}){
    const db=await openDb(),tx=db.transaction(ITEM_STORE,"readonly"),idx=tx.objectStore(ITEM_STORE).index("cacheParent");
    const out=[],seen=new Set(),queue=(rootKeys||[]).map(k=>({key:String(k),depth:0}));
    while(queue.length){const {key,depth}=queue.shift();if(depth>=maxDepth)continue;const rows=await request(idx.getAll(IDBKeyRange.only([namespace,cacheKey,key])));for(const r of rows){if(seen.has(r.itemKey))continue;seen.add(r.itemKey);out.push(r.payload);queue.push({key:r.itemKey,depth:depth+1});}}
    return out;
  }
  async function getAncestors(namespace,cacheKey,rootKeys,{maxDepth=20}={}){
    const db=await openDb(),tx=db.transaction(ITEM_STORE,"readonly"),store=tx.objectStore(ITEM_STORE);
    const out=[],seen=new Set(),queue=(rootKeys||[]).map(k=>({key:String(k),depth:0}));
    while(queue.length){
      const {key,depth}=queue.shift();if(depth>=maxDepth)continue;
      const r=await request(store.get([namespace,cacheKey,key]));if(!r)continue;
      const parent=r.parentKey==null?null:String(r.parentKey);
      if(parent==null||seen.has(parent))continue;
      seen.add(parent);
      const pr=await request(store.get([namespace,cacheKey,parent]));
      if(pr){out.push(pr.payload);queue.push({key:parent,depth:depth+1});}
    }
    return out;
  }
  async function replace(namespace,cacheKey,rows,{keyField,parentField,meta}={}){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE),idx=items.index("cache");
    await new Promise((resolve,reject)=>{const r=idx.openKeyCursor(IDBKeyRange.only([namespace,cacheKey]));r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();items.delete(c.primaryKey);c.continue();};});
    for(const row of rows||[]){const key=row?.[keyField];if(key==null)continue;items.put({namespace,cacheKey,itemKey:String(key),parentKey:parentField&&row?.[parentField]!=null?String(row[parentField]):null,payload:row});}
    tx.objectStore(META_STORE).put({namespace,cacheKey,...(meta||{}),rowCount:(rows||[]).length,savedAt:new Date().toISOString()});await txDone(tx);
  }
  async function merge(namespace,cacheKey,rows,{keyField,parentField,meta}={}){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE),metas=tx.objectStore(META_STORE);
    const previous=(await request(metas.get([namespace,cacheKey])))||{};
    for(const row of rows||[]){const key=row?.[keyField];if(key==null)continue;items.put({namespace,cacheKey,itemKey:String(key),parentKey:parentField&&row?.[parentField]!=null?String(row[parentField]):null,payload:row});}
    metas.put({...previous,namespace,cacheKey,...(meta||{}),savedAt:new Date().toISOString()});await txDone(tx);
  }
  async function clear(namespace,cacheKey){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE),idx=items.index("cache");
    await new Promise((resolve,reject)=>{const r=idx.openKeyCursor(IDBKeyRange.only([namespace,cacheKey]));r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();items.delete(c.primaryKey);c.continue();};});
    tx.objectStore(META_STORE).delete([namespace,cacheKey]);await txDone(tx);
  }
  window.WalletTrackingBrowserCache={getMeta,getAll,getByKeys,getDescendants,getAncestors,replace,merge,clear,DB_NAME,DB_VERSION};
})();
