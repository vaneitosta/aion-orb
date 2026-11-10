(()=>{'use strict';
const KEYS={tasks:'aion-dashboard-local-v1',sessions:'aion-dashboard-study-v02',focusSessions:'aion-focus-history-v05'};
const status=document.getElementById('auto-backup-status');
const saveButton=document.getElementById('auto-backup-now');
const restoreButton=document.getElementById('auto-restore');
let serverAvailable=false, timer=null, busy=false, restoring=false, connecting=false;
const read=(key)=>{const v=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(v))throw Error('Dados locais inválidos');return v};
const snapshot=()=>({version:2,tasks:read(KEYS.tasks),sessions:read(KEYS.sessions),focusSessions:read(KEYS.focusSessions)});
const say=(t)=>{status.textContent=t};
async function api(path,options){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);try{const res=await fetch(path,{cache:'no-store',credentials:'same-origin',...options,signal:controller.signal});if(!res.ok)throw Error('HTTP '+res.status);return await res.json()}finally{clearTimeout(timeout)}}
async function writeSnapshot(data){
 const result=await api('/api/backup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 if(!['salvo','sem alteracoes'].includes(result.status))throw Error('Resposta de backup inválida');
 return result;
}
async function save(){
 if(busy||restoring){say('Aguarde a operação de proteção em andamento.');return false}
 if(!serverAvailable){say('Servidor de proteção indisponível.');return false}
 busy=true;
 try{const result=await writeSnapshot(snapshot());say(result.status==='salvo'?'Backup dos dados salvo no computador.':'Dados protegidos; nenhuma alteração recente.');return true}
 catch(e){serverAvailable=false;say('Falha ao salvar no computador. Os dados continuam neste navegador; tentaremos reconectar. Você também pode exportar JSON.');return false}
 finally{busy=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>serverAvailable?save():connect(),750)}
function validBackup(d){
 const areas=['estudos','projetos','trabalho'];
 return d&&d.version===2&&Array.isArray(d.tasks)&&d.tasks.length<=10000&&Array.isArray(d.sessions)&&d.sessions.length<=10000&&Array.isArray(d.focusSessions)&&d.focusSessions.length<=200&&
 d.tasks.every(t=>t&&typeof t.id==='string'&&typeof t.name==='string'&&t.name.length>0&&t.name.length<=90&&areas.includes(t.type)&&typeof t.done==='boolean'&&(!t.dueDate||typeof t.dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)))&&
 d.sessions.every(s=>s&&typeof s.id==='string'&&typeof s.subject==='string'&&s.subject.length>0&&s.subject.length<=70&&typeof s.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&Number.isInteger(s.total)&&s.total>=1&&s.total<=1000&&Number.isInteger(s.correct)&&s.correct>=0&&s.correct<=s.total)&&
 d.focusSessions.every(f=>f&&areas.includes(f.area)&&Number.isFinite(f.minutes)&&f.minutes>0&&f.minutes<=180&&typeof f.date==='string');
}
async function restore(){
 if(busy||restoring){say('Aguarde a operação de proteção em andamento.');return}
 if(!serverAvailable){say('Servidor de proteção indisponível.');return}
 restoring=true;clearTimeout(timer);
 try{
  const latest=await api('/api/backup/latest');const d=latest.data;
  if(!validBackup(d))throw Error('Backup inválido');
  if(!confirm(`Restaurar backup de ${new Date(latest.savedAt).toLocaleString('pt-BR')}? Os dados deste navegador serão substituídos. Uma cópia dos dados atuais será feita antes.`))return;
  const before=Object.fromEntries(Object.values(KEYS).map(key=>[key,localStorage.getItem(key)]));
  await writeSnapshot(snapshot()); // Failure aborts before any localStorage write.
  if(Object.entries(before).some(([key,value])=>localStorage.getItem(key)!==value))throw Error('Dados alterados durante a restauração');
  try{
   for(const [k,key] of Object.entries(KEYS))localStorage.setItem(key,JSON.stringify(d[k]));
  }catch(error){
   // Recover partial writes; the complete previous state is also saved on disk.
   for(const [key,value] of Object.entries(before)){
    try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch(_){}
   }
   throw error;
  }
  say('Restauração feita. Recarregando painel...');location.reload();
 }catch(e){say('Restauração interrompida. O backup pode estar inválido, o salvamento falhou ou os dados mudaram. Se houve falha de armazenamento, a cópia anterior está no PC quando o salvamento foi concluído.')}
 finally{restoring=false}
}
saveButton.addEventListener('click',()=>serverAvailable?save():connect());restoreButton.addEventListener('click',restore);
document.addEventListener('aion-data-changed',schedule);
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))schedule()});
async function connect(){
 if(connecting||busy||restoring||serverAvailable)return;
 connecting=true;
 try{const health=await api('/api/status');if(health.ok!==true||health.mode!=='local-only')throw Error('Servidor inválido');serverAvailable=true;say('Proteção local ativa. Alterações serão salvas automaticamente.');
  // First launch: avoid blank snapshots overwriting an existing backup.
  const current=snapshot();const hasData=current.tasks.length||current.sessions.length||current.focusSessions.length;
  if(hasData)await save();
  else {const b=await api('/api/backups');if(b.files.length)say('Há um backup no computador. Use Restaurar para recuperar os dados.');else say('Ainda não há backup de dados no PC. Cadastre dados ou use Salvar dados no PC.');}
 }catch(e){serverAvailable=false;say('Servidor de proteção não encontrado. Tentaremos reconectar; você também pode exportar os dados manualmente.')}
 finally{connecting=false}
}
setInterval(()=>{if(document.visibilityState!=='visible')return;if(!serverAvailable){connect();return}try{const d=snapshot();if(d.tasks.length+d.sessions.length+d.focusSessions.length)save()}catch(e){say('Dados locais inválidos. Exporte e confira os dados antes de restaurar.')}},10*60*1000);
setInterval(()=>{if(document.visibilityState==='visible'&&!serverAvailable)connect()},30000);
window.addEventListener('online',connect);
window.addEventListener('focus',connect);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')connect()});
connect();
})();
