const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/protecao.js'),'utf8');
const keys=['aion-dashboard-local-v1','aion-dashboard-study-v02','aion-focus-history-v05'];
const older={version:2,tasks:[{id:'older',name:'Older task',type:'estudos',done:false}],sessions:[],focusSessions:[]};
const tick=()=>new Promise(r=>setImmediate(r));
async function setup(options={}){
 const handlers={},store=new Map(),elements={};let writes=0,reloads=0,posts=0,failOnce=options.storageFail,release;
 const ctx={document:{getElementById(id){return elements[id]??={textContent:'',addEventListener(e,fn){handlers[id]=fn}}},addEventListener(){},visibilityState:'visible'},localStorage:{getItem:k=>store.get(k)??null,setItem(k,v){writes++;if(failOnce&&k===keys[1]){failOnce=false;throw Error('quota')}store.set(k,v)},removeItem:k=>store.delete(k)},window:{addEventListener(){}},location:{reload(){reloads++}},confirm:()=>!options.cancel,setInterval(){},setTimeout(){},clearTimeout(){},fetch:async(path,init)=>{
  if(init?.method==='POST'){posts++;if(options.delay)await new Promise(r=>release=r);if(options.mutate)store.set(keys[0],'[{"name":"Concurrent"}]');if(options.networkFail)throw Error('network')}
  return {ok:!(options.httpFail&&init?.method==='POST'),status:500,json:async()=>path==='/api/backup/latest'?{savedAt:'2026-11-09',data:options.invalid?{...older,tasks:[{}]}:older}:path==='/api/backups'?{files:[]}:path==='/api/status'?{ok:true}:{status:options.badReply?'unknown':'salvo'}}
 }};
 vm.runInNewContext(source,ctx);await tick();
 return {handlers,store,elements,state:()=>({writes,reloads,posts}),release:()=>release()};
}
(async()=>{
 for(const option of ['httpFail','networkFail','badReply','cancel','invalid']){
  const x=await setup({[option]:true});await x.handlers['auto-restore']();assert.equal(x.state().writes,0,option);assert.equal(x.state().reloads,0);console.log('PASS blocked restore:',option);
 }
 let x=await setup();await x.handlers['auto-restore']();assert.equal(x.state().writes,3);assert.equal(x.state().reloads,1);assert.deepEqual(JSON.parse(x.store.get(keys[0])),older.tasks);console.log('PASS restore success');
 x=await setup({storageFail:true});await x.handlers['auto-restore']();assert.equal(x.store.size,0);assert.equal(x.state().reloads,0);console.log('PASS partial storage failure rollback');
 x=await setup({delay:true});const save=x.handlers['auto-backup-now']();await tick();await x.handlers['auto-restore']();assert.equal(x.state().writes,0);x.release();await save;console.log('PASS active save blocks restore');
 x=await setup({delay:true});const restore=x.handlers['auto-restore']();await tick();await x.handlers['auto-restore']();assert.equal(x.state().posts,1);assert.equal(await x.handlers['auto-backup-now'](),false);x.release();await restore;assert.equal(x.state().reloads,1);console.log('PASS concurrent restore/save blocked');
 x=await setup({mutate:true});await x.handlers['auto-restore']();assert.equal(x.state().writes,0);assert.equal(x.state().reloads,0);console.log('PASS concurrent data change aborts restore');
 x=await setup();x.store.set(keys[0],'broken json');await x.handlers['auto-restore']();assert.equal(x.state().posts,0);assert.equal(x.state().writes,0);console.log('PASS corrupt current storage preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
