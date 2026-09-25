import {createHmac} from 'node:crypto';
import assert from 'node:assert/strict';
const expires=String(Date.now()+60000);
const cookie=`codex_session=${expires}.${createHmac('sha256',process.env.SESSION_SECRET).update(expires).digest('base64url')}`;
const base='http://127.0.0.1:3000';
const headers={cookie,origin:base,'content-type':'application/json'};
async function get(path){const res=await fetch(base+path,{headers});assert.equal(res.status,200,path);return res.json();}
assert.equal((await get('/health')).status,'ok');
const {projects}=await get('/api/projects');
for(const p of projects)await get(`/api/projects/${p.id}/git`);
const results=await Promise.all([get('/api/models'),get('/api/usage')]);
assert.ok(results[0].models.length);
assert.equal((await fetch(base+'/api/projects')).status,401);
assert.equal((await fetch(base+'/api/projects',{headers:{cookie:'codex_session=%ZZ'}})).status,401);
assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
const p=projects.find(p=>p.name==='Свободная папка');
const controller=new AbortController();
const response=await fetch(base+`/api/chat/events?projectId=${p.id}`,{headers,signal:controller.signal});
const reader=response.body.getReader();const decoder=new TextDecoder();let first=decoder.decode((await reader.read()).value);
assert.match(first,/snapshot/);
if(process.argv.includes('--chat')){
 const res=await fetch(base+'/api/chat',{method:'POST',headers,body:JSON.stringify({projectId:p.id,text:'Reply exactly AUDIT_OK. Do not use tools or modify files.',model:results[0].models.find(m=>m.isDefault)?.id})});
 assert.equal(res.status,202);let all=first;const timer=setTimeout(()=>controller.abort(),60000);
 try{while(!all.includes('"type":"done"')){const chunk=await reader.read();if(chunk.done)break;all+=decoder.decode(chunk.value);}assert.match(all,/AUDIT_OK/);assert.match(all,/"type":"done"/);}finally{clearTimeout(timer);}
}
controller.abort();
console.log(`PASS: health, ${projects.length} project Git endpoints, models/usage, auth, malformed cookie, CSRF, SSE${process.argv.includes('--chat')?', live chat':''}`);
