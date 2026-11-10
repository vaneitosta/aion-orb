(()=>{'use strict';
const $=id=>document.getElementById(id);
// Parser determinístico: não usa eval, Function nem execução de expressões arbitrárias.
function calculate(src){
 const tokens=[];let i=0;src=String(src).replace(/,/g,'.');
 while(i<src.length){const rem=src.slice(i);if(/^\s/.test(rem)){i++;continue}
  let m=rem.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
  if(m){tokens.push({kind:'num',value:Number(m[0])});i+=m[0].length;continue}
  if('+-*/()%'.includes(src[i])){tokens.push({kind:src[i]});i++;continue}
  throw Error('Expressão inválida');}
 let p=0;const current=()=>tokens[p]?.kind;
 const primary=()=>{if(current()==='+'){p++;return primary()}if(current()==='-'){p++;return -primary()}if(current()==='('){p++;const v=sum();if(current()!==')')throw Error('Parênteses não fechados');p++;return v}if(current()==='num'){return tokens[p++].value}throw Error('Expressão incompleta')};
 const percent=()=>{let v=primary();while(current()==='%'){p++;v/=100}return v};
 const product=()=>{let v=percent();while(current()==='*'||current()==='/'){let op=tokens[p++].kind,n=percent();if(op==='/'&&n===0)throw Error('Divisão por zero');v=op==='*'?v*n:v/n}return v};
 const sum=()=>{let v=product();while(current()==='+'||current()==='-'){let op=tokens[p++].kind,n=product();v=op==='+'?v+n:v-n}return v};
 if(!tokens.length)throw Error('Digite uma expressão');let value=sum();if(p!==tokens.length||!Number.isFinite(value))throw Error('Resultado inválido');return Number(value.toPrecision(12));
}
window.AION_TEST={calculate};
const display=$('calc-display');const status=$('calc-status');
['C','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0',',','%','+','.','=','/','*'].forEach(key=>{
 const b=document.createElement('button');b.type='button';b.textContent=key;if(key==='=')b.className='calc-eq';b.setAttribute('aria-label',key==='⌫'?'Apagar último caractere':key==='C'?'Limpar':key);
 b.addEventListener('click',()=>{if(key==='C'){display.value='';status.textContent='';return}if(key==='⌫'){display.value=display.value.slice(0,-1);return}if(key==='='){solve();return}if(display.value.length>=120)return;display.value+=({'×':'*','÷':'/','−':'-'}[key]||key);status.textContent=''});$('calc-buttons').appendChild(b)
});
function solve(){try{const n=calculate(display.value);display.value=String(n).replace('.',',');status.textContent='Resultado calculado localmente.'}catch(e){status.textContent=e.message}}
display.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();solve()}});
// Cronômetro com tempo decorrido real e pausas; não registra sessões incompletas.
const FOCUS_KEY='aion-focus-history-v05';let history=[];
try{const h=JSON.parse(localStorage.getItem(FOCUS_KEY)||'[]');if(Array.isArray(h))history=h.filter(x=>x&&Number.isFinite(x.minutes)&&x.minutes>0&&['estudos','projetos','trabalho'].includes(x.area)&&typeof x.date==='string').slice(-200)}catch(_){}
let mode='idle',durationMs=25*60000,remainingMs=durationMs,endAt=0,interval=null,quietBefore=false;
function persistFocus(){try{localStorage.setItem(FOCUS_KEY,JSON.stringify(history));document.dispatchEvent(new Event('aion-data-changed'))}catch(_){$('focus-status').textContent='Não foi possível guardar o histórico. Confira o armazenamento.'}}
function renderHistory(){const by=history.reduce((a,x)=>a+x.minutes,0);$('focus-history').textContent=`${history.length} sessões concluídas · ${by} minutos acumulados (neste navegador).`}
function renderClock(){let remain=mode==='running'?Math.max(0,endAt-Date.now()):remainingMs;const seconds=Math.ceil(remain/1000);$('focus-clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');$('focus-progress').style.width=Math.min(100,Math.max(0,(durationMs-remain)/durationMs*100))+'%';$('focus-start').disabled=mode==='running';$('focus-pause').disabled=mode!=='running';$('focus-start').textContent=mode==='paused'?'Retomar':'Iniciar';}
function finish(){mode='done';remainingMs=0;clearInterval(interval);interval=null;const minutes=durationMs/60000;history.push({area:$('focus-area').value,minutes,date:new Date().toISOString()});history=history.slice(-200);persistFocus();renderHistory();$('focus-status').textContent='Sessão concluída e registrada neste dispositivo.';renderClock()}
function tick(){if(mode==='running'&&Date.now()>=endAt)finish();else renderClock()}
$('focus-minutes').addEventListener('change',()=>{if(mode==='running'||mode==='paused')return;const n=Number($('focus-minutes').value);if(!Number.isInteger(n)||n<1||n>180){$('focus-status').textContent='Escolha de 1 a 180 minutos.';return}durationMs=n*60000;remainingMs=durationMs;mode='idle';renderClock()});
$('focus-start').addEventListener('click',()=>{if(mode==='running')return;if(mode!=='paused'){const n=Number($('focus-minutes').value);if(!Number.isInteger(n)||n<1||n>180){$('focus-status').textContent='Escolha de 1 a 180 minutos.';return}durationMs=n*60000;remainingMs=durationMs;}mode='running';endAt=Date.now()+remainingMs;clearInterval(interval);interval=setInterval(tick,500);$('focus-status').textContent='Sessão em andamento. Mantenha o navegador aberto.';tick()});
$('focus-pause').addEventListener('click',()=>{if(mode!=='running')return;remainingMs=Math.max(0,endAt-Date.now());mode='paused';clearInterval(interval);interval=null;$('focus-status').textContent='Sessão pausada.';renderClock()});
$('focus-reset').addEventListener('click',()=>{clearInterval(interval);interval=null;mode='idle';durationMs=Math.max(1,Math.min(180,Number($('focus-minutes').value)||25))*60000;remainingMs=durationMs;$('focus-status').textContent='Sessão reiniciada (sem registro).';renderClock()});
$('focus-quiet').addEventListener('change',e=>{$('focus-status').textContent=e.target.checked?'Avisos internos de conclusão de foco ficam apenas no painel. Notificações do sistema continuam ativas.':'Avisos internos retomados.'});
renderClock();renderHistory();
document.addEventListener('aion-backup-imported',()=>{try{const h=JSON.parse(localStorage.getItem(FOCUS_KEY)||'[]');history=Array.isArray(h)?h.filter(x=>x&&Number.isFinite(x.minutes)&&x.minutes>0&&['estudos','projetos','trabalho'].includes(x.area)&&typeof x.date==='string').slice(-200):[]}catch(_){history=[]}renderHistory()});
// PWA: o navegador decide se a instalação é suportada.
const secure=window.isSecureContext;const storage=(()=>{try{const key='aion-storage-probe';localStorage.setItem(key,'ok');const fine=localStorage.getItem(key)==='ok';localStorage.removeItem(key);return fine}catch(_){return false}})();
$('security-origin').textContent=secure?'Contexto seguro':'Sem HTTPS / localhost';$('security-storage').textContent=storage?'Disponível neste navegador':'Indisponível';$('security-offline').textContent='Não verificado';
$('security-backup').addEventListener('click',()=>$('export').click());$('security-import').addEventListener('click',()=>$('import').click());
let installPrompt=null;window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('app-install').hidden=false});
$('app-install').addEventListener('click',async()=>{if(!installPrompt)return;const event=installPrompt;installPrompt=null;$('app-install').hidden=true;await event.prompt()});
window.addEventListener('appinstalled',()=>{$('app-install').hidden=true});
if('serviceWorker' in navigator&&secure){navigator.serviceWorker.register('./sw.js').then(async()=>{$('security-offline').textContent='Cache configurado (teste offline recomendado)'}).catch(()=>{$('security-offline').textContent='Não disponível'})}
else $('security-offline').textContent='Requer contexto seguro';
})();
