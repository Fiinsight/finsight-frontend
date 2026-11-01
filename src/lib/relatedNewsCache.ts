import type {LocalMlQuery,LocalMlResult,LocalMlTransport} from "../localml/LocalMlPanel";
const caches=new WeakMap<LocalMlTransport,Map<string,{expires:number;value:Promise<LocalMlResult>}>>();
const TTL=5*60_000;
export function cachedNewsSearch(search:LocalMlTransport,request:LocalMlQuery,newsId?:number,refresh=false):Promise<LocalMlResult> {
 // Only public article searches are cached. User case/term queries bypass this cache.
 if(request.kind!=="news"||!Number.isSafeInteger(newsId)||!newsId)return search(request);
 let cache=caches.get(search);if(!cache){cache=new Map();caches.set(search,cache);}
 const key=JSON.stringify([newsId,request]);const hit=cache.get(key);
 if(!refresh&&hit&&hit.expires>Date.now())return hit.value;
 for(const [k,v] of cache)if(v.expires<=Date.now())cache.delete(k);
 if(cache.size>=100)cache.delete(cache.keys().next().value!);
 const entry={expires:Date.now()+TTL,value:Promise.resolve().then(()=>search(request))};
 cache.set(key,entry);
 void entry.value.catch(()=>{if(cache.get(key)===entry)cache.delete(key);});
 return entry.value;
}
