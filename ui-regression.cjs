const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
class Element {
 constructor(){this.value='';this.textContent='';this.children=[];this.disabled=true;this.handlers={};}
 add(x){this.children.push(x);if(!this.value)this.value=x.value;}
 append(x){this.children.push(x);}
 replaceChildren(){this.children=[];}
 querySelector(){return null;}
 addEventListener(name,fn){this.handlers[name]=fn;}
}
const ids=['project','model','effort','branch','status','messages','prompt','composer','send','stop','chat-status','usage-refresh','limit-five','limit-week','clone-form','clone-url','clone-status','refresh'];
const elements=Object.fromEntries(ids.map(id=>['#'+id,new Element()]));
let failed=false;const streams=[];
const context={document:{querySelector:s=>elements[s]??null,createElement:()=>new Element()},Option:function(text,value){this.text=text;this.value=value},localStorage:{getItem:()=>null,setItem:()=>{}},EventSource:class{constructor(){streams.push(this)}close(){}},setInterval:()=>{},matchMedia:()=>({matches:false}),location:{origin:'http://test'},fetch:async url=>({ok:!(failed&&url==='/api/chat'),status:500,json:async()=>url==='/api/projects'?{projects:[{id:'one',name:'One',path:'/one'}]}:url==='/api/models'?{models:[{id:'m',supportedReasoningEfforts:[]}]}:url==='/api/usage'?{windows:[]}:url.endsWith('/git')?{branch:'main',summary:'clean'}:{error:'test failure'}})};
vm.createContext(context);vm.runInContext(readFileSync(process.argv[2],'utf8'),context);
(async()=>{
 await new Promise(r=>setImmediate(r));
 assert.equal(elements['#prompt'].disabled,false,'Missing optional #path must not disable composer');
 const stream=streams.at(-1),snapshot={type:'snapshot',events:[{type:'user',text:'hello'},{type:'assistant_delta',delta:'reply'},{type:'done'}],active:false};
 stream.onmessage({data:JSON.stringify(snapshot)});stream.onmessage({data:JSON.stringify(snapshot)});
 assert.equal(elements['#messages'].children.length,2,'Reconnect must not duplicate history');
 failed=true;elements['#prompt'].value='Keep this draft';
 await elements['#composer'].handlers.submit({preventDefault(){}});
 assert.equal(elements['#prompt'].value,'Keep this draft','Failed send must retain text');
 assert.equal(elements['#chat-status'].textContent,'test failure');
 console.log('PASS: missing DOM element, reconnect snapshot, failed-send draft retention');
})().catch(e=>{console.error(e);process.exitCode=1});
