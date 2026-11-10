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

// Biblioteca privada: planejamento explícito; arquivos e catálogo ficam fora do código.
(()=>{'use strict';
 const host=document.getElementById('studies-area');if(!host)return;
 const panel=document.createElement('section');panel.className='panel wide';panel.id='materials-panel';
 panel.innerHTML='<h2>Meus materiais de estudo</h2><p class="hint">Abra as cópias dos seus materiais. Consultar um arquivo não registra uma sessão de estudo.</p><div class="materials-controls"><label>Pesquisar<input id="materials-search" type="search" placeholder="Ex.: orçamento, Windows…"></label><label>Área<select id="materials-area"><option value="">Todas as áreas</option></select></label><button id="materials-clear" type="button">Limpar filtros</button><button id="materials-refresh" type="button">Atualizar biblioteca</button></div><p id="materials-status" role="status"></p><p id="materials-count" aria-live="polite"></p><div id="materials-list" class="materials-grid"></div>';
 host.prepend(panel);
 const search=panel.querySelector('input'),status=panel.querySelector('[role=status]'),list=panel.querySelector('#materials-list'),refresh=panel.querySelector('#materials-refresh'),areaFilter=panel.querySelector('select'),count=panel.querySelector('#materials-count'),clear=panel.querySelector('#materials-clear');let items=[],loaded=false;
 const normal=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){
  list.replaceChildren();const term=normal(search.value.trim());const selected=items.filter(i=>(!areaFilter.value||i.area===areaFilter.value)&&normal(i.titulo+' '+i.area+' '+i.assunto).includes(term));
  for(const item of selected){
   const card=document.createElement('article');card.className='material-card';
   const title=document.createElement('h3');title.textContent=item.titulo;
   const area=document.createElement('p');area.textContent=item.area+' · '+item.assunto;
   const link=document.createElement(item.disponivel?'a':'span');link.textContent=item.disponivel?'Abrir cópia do PDF':'Cópia não encontrada';
   if(item.disponivel){link.href='/api/materials/'+encodeURIComponent(item.id)+'/file';link.target='_blank';link.rel='noopener noreferrer'}
   const plan=document.createElement('button');plan.type='button';plan.className='material-plan';plan.textContent='Planejar estudo';plan.disabled=!item.disponivel;plan.setAttribute('aria-label','Planejar estudo: '+item.titulo);
   plan.addEventListener('click',()=>{const request={id:item.id,title:item.titulo};document.dispatchEvent(new CustomEvent('aion-plan-material',{detail:request}));status.textContent=request.message||'Não foi possível criar a atividade.'});
   card.append(title,area,link,plan);list.append(card);
  }
  count.textContent=!loaded?'':items.length?selected.length+' de '+items.length+' materiais · '+selected.filter(i=>i.disponivel).length+' disponíveis.':'Nenhum material cadastrado nesta biblioteca.';
  if(loaded&&items.length&&!selected.length){const empty=document.createElement('p');empty.textContent='Nenhum resultado. Tente outro termo ou limpe os filtros.';list.append(empty)}
  clear.disabled=!search.value&&!areaFilter.value;
 }
 async function load(){
  if(refresh.disabled)return;
  refresh.disabled=true;panel.setAttribute('aria-busy','true');status.textContent='Carregando biblioteca…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch('/api/materials',{cache:'no-store',signal:controller.signal});if(response.status===404)throw Error('restart');if(!response.ok)throw Error('request');const data=await response.json();
   if(!Array.isArray(data.materials)||!data.materials.every(i=>i&&typeof i.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(i.id)&&typeof i.titulo==='string'&&typeof i.area==='string'&&typeof i.assunto==='string'&&typeof i.disponivel==='boolean'))throw Error('invalid');
   items=data.materials;loaded=true;const previous=areaFilter.value;areaFilter.replaceChildren(new Option('Todas as áreas',''));for(const area of [...new Set(items.map(i=>i.area))].sort((a,b)=>a.localeCompare(b,'pt-BR')))areaFilter.add(new Option(area,area));if([...areaFilter.options].some(o=>o.value===previous))areaFilter.value=previous;
   status.textContent='Biblioteca atualizada. Os PDFs abrem em outra janela ou aba.';render();
  }catch(e){status.textContent=e.message==='restart'?'A biblioteca estará disponível depois de reiniciar o computador e abrir o AION pelo atalho.':e.name==='AbortError'?'O servidor demorou para responder. Tente atualizar novamente.':'Não foi possível atualizar. Confira se o AION está aberto no computador e tente novamente.';if(loaded)status.textContent+=' A lista anterior foi mantida; a abertura dos PDFs depende do servidor.';render()}
  finally{clearTimeout(timer);refresh.disabled=false;panel.setAttribute('aria-busy','false')}
 }
 search.addEventListener('input',render);areaFilter.addEventListener('change',render);clear.addEventListener('click',()=>{search.value='';areaFilter.value='';render();search.focus()});refresh.addEventListener('click',load);load();
})();
