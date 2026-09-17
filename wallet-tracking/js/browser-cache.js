// WalletTracking · zentraler persistenter Browser-Cache (IndexedDB)
// Schemaoffen: Payloads werden als vollständige Objekte gespeichert. DB-Spalten dürfen
// ergänzt werden, ohne dass dafür das IndexedDB-Schema geändert werden muss.
(() => {
  const DB_NAME="wallet_tracking_cache";
  const DB_VERSION=1;
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
        }
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
  async function replace(namespace,cacheKey,rows,{keyField,meta}={}){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE),idx=items.index("cache");
    await new Promise((resolve,reject)=>{const r=idx.openKeyCursor(IDBKeyRange.only([namespace,cacheKey]));r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();items.delete(c.primaryKey);c.continue();};});
    for(const row of rows||[]){const key=row?.[keyField];if(key==null)continue;items.put({namespace,cacheKey,itemKey:String(key),payload:row});}
    tx.objectStore(META_STORE).put({namespace,cacheKey,...(meta||{}),savedAt:new Date().toISOString()});await txDone(tx);
  }
  async function merge(namespace,cacheKey,rows,{keyField,meta}={}){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE);
    for(const row of rows||[]){const key=row?.[keyField];if(key==null)continue;items.put({namespace,cacheKey,itemKey:String(key),payload:row});}
    tx.objectStore(META_STORE).put({namespace,cacheKey,...(meta||{}),savedAt:new Date().toISOString()});await txDone(tx);
  }
  async function clear(namespace,cacheKey){
    const db=await openDb(),tx=db.transaction([ITEM_STORE,META_STORE],"readwrite"),items=tx.objectStore(ITEM_STORE),idx=items.index("cache");
    await new Promise((resolve,reject)=>{const r=idx.openKeyCursor(IDBKeyRange.only([namespace,cacheKey]));r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();items.delete(c.primaryKey);c.continue();};});
    tx.objectStore(META_STORE).delete([namespace,cacheKey]);await txDone(tx);
  }
  window.WalletTrackingBrowserCache={getMeta,getAll,replace,merge,clear,DB_NAME,DB_VERSION};
})();
