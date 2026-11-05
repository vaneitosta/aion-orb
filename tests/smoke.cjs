const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(js,'Inline JS missing');
new vm.Script(js);
const storage={};
function el(x={}){return {textContent:'',value:'',hidden:false,dataset:{},files:[],style:{},listeners:{},setAttribute(k,v){this[k]=v},addEventListener(k,cb){this.listeners[k]=cb},click(){this.listeners.click?.()},replaceChildren(){},append(){},...x}}
function boot(){const ids=['state','hint','message','form','prompt','mic','attach','file','panel','panelTitle','panelText','panelAction','closePanel'];const n=Object.fromEntries(ids.map(id=>[id,el()]));const b=[...['idle','listening','thinking','speaking'].map(mode=>el({dataset:{mode},textContent:mode})),...['inicio','conversas','projetos','agenda','metas','dados','config'].map(panel=>el({dataset:{panel}}))];const doc={body:el(),getElementById:id=>n[id],querySelectorAll:q=>q.includes('data-mode')?b.filter(x=>x.dataset.mode):b.filter(x=>x.dataset.panel),createElement:()=>el()};const speech={cancel(){},speak(){}};const ctx={document:doc,window:{speechSynthesis:speech},speechSynthesis:speech,SpeechSynthesisUtterance:function(t){this.text=t},navigator:{},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},setTimeout:fn=>{fn();return 1},clearTimeout(){}};vm.runInNewContext(js,ctx);return {n,b,doc,submit(t){n.prompt.value=t;n.form.listeners.submit({preventDefault(){}});return n.message.textContent},panel(k){b.find(x=>x.dataset.panel===k).click();return n.panelText.textContent}}}
const a=boot();assert.equal(a.b.filter(x=>x.dataset.panel&&x.listeners.click).length,7);assert.equal(a.b.filter(x=>x.dataset.mode&&x.listeners.click).length,4);
assert.match(a.submit('tarefa: Estudar'),/adicionada/);assert.match(a.submit('concluir 1'),/concluída/);assert.match(a.submit('nota: Revisão'),/salva/);assert.match(a.submit('evento: 2026-02-31 inválido'),/inválida/);assert.match(a.submit('evento: 2026-12-10 prova'),/registrado/);assert.match(a.submit('resumo'),/concluídas: 1/);assert.match(a.submit('excluir nota 1'),/excluído/);assert.match(boot().panel('metas'),/Estudar/);a.panel('config');a.n.panelAction.click();assert.equal(a.doc.body.dataset.reduced,'true');a.n.closePanel.click();assert.equal(a.n.panel.hidden,true);assert.equal(typeof a.n.mic.listeners.click,'function');
// Backup restore must not partially overwrite data when storage writes fail.
async function testRestoreRollback(){
 const original=storage['aion-orb-organizer'];
 const previousHistory=storage['aion-orb-history-v22'];
 const n=Object.fromEntries(['state','hint','message','form','prompt','mic','attach','file','panel','panelTitle','panelText','panelAction','closePanel'].map(id=>[id,el()]));
 const b=[...['idle','listening','thinking','speaking'].map(mode=>el({dataset:{mode}})),...['inicio','conversas','projetos','agenda','metas','dados','config'].map(panel=>el({dataset:{panel}}))];
 const doc={body:el(),getElementById:id=>n[id],querySelectorAll:q=>q.includes('data-mode')?b.filter(x=>x.dataset.mode):b.filter(x=>x.dataset.panel),createElement:()=>el()};
 const local={getItem:k=>storage[k]??null,setItem(k,v){if(k==='aion-orb-history-v22'&&String(v).includes('Imported test'))throw Error('QuotaExceeded');storage[k]=v},removeItem(k){delete storage[k]}};
 const speech={cancel(){},speak(){}};
 vm.runInNewContext(js,{document:doc,window:{speechSynthesis:speech,confirm:()=>true},speechSynthesis:speech,SpeechSynthesisUtterance:function(t){this.text=t},navigator:{},localStorage:local,setTimeout:fn=>{fn();return 1},clearTimeout(){}});
 const payload={version:1,tasks:[{text:'Imported test',done:false}],notes:[],events:[],history:[{who:'Você',text:'Imported test'}]};
 n.file.files=[{name:'backup.json',size:300,text:async()=>JSON.stringify(payload)}];
 await n.file.listeners.change();
 assert.match(n.message.textContent,/Falha ao salvar o backup/);
 assert.equal(storage['aion-orb-organizer'],original);
 assert.equal(storage['aion-orb-history-v22'],previousHistory);
}
testRestoreRollback().then(()=>console.log('AION Orb smoke tests: PASS')).catch(e=>{console.error(e);process.exitCode=1});

