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
   const note=document.createElement('button');note.type='button';note.className='material-note';note.textContent='Anotar dúvida';note.setAttribute('aria-label','Anotar dúvida: '+item.titulo);note.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('aion-note-material',{detail:{title:item.titulo}})));card.append(title,area,link,plan,note);list.append(card);
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

// Áreas de trabalho e caderno privado. Sem dependências externas.
(()=>{'use strict';
const $=id=>document.getElementById(id),main=document.querySelector('main'),oldNav=document.querySelector('.nav');
const definitions={overview:['Visão geral','Seu panorama, com espaço para focar.'],tasks:['Atividades','Organize o que precisa fazer, por área.'],studies:['Estudos','Registre sessões e acompanhe sua aprendizagem.'],library:['Biblioteca','Consulte materiais e planeje o próximo estudo.'],calendar:['Agenda','Confira datas e compromissos em um só lugar.'],notes:['Anotações','Guarde ideias, dúvidas e lembretes.'],tools:['Ferramentas','Calculadora e concentração quando você precisar.'],settings:['Proteção dos dados','Confira seus backups e as opções do aplicativo.']};
const sections={};for(const [key,[title]] of Object.entries(definitions)){const section=document.createElement('section');section.className='workspace-view';section.id='view-'+key;section.setAttribute('aria-label',title);section.hidden=true;main.insertBefore(section,document.querySelector('.foot'));sections[key]=section}
const move=(node,key)=>{if(node)sections[key].append(node)};
move($('summary'),'overview');move(main.querySelector(':scope > .grid'),'overview');
move(main.querySelector(':scope > .lower'),'tasks');oldNav.className='area-tabs';oldNav.setAttribute('aria-label','Filtrar atividades');sections.tasks.prepend(oldNav);
move($('materials-panel'),'library');move($('studies-area'),'studies');move($('insights-panel'),'studies');
move($('planning-panel'),'calendar');move($('calendar-panel'),'calendar');move($('toolbox'),'tools');move($('settings-panel'),'settings');
for(const section of [...main.querySelectorAll(':scope > section.panel')])move(section,'settings');
const nav=document.createElement('nav');nav.className='workspace-nav';nav.setAttribute('aria-label','Funções do AION');
for(const [key,[title]] of Object.entries(definitions)){const button=document.createElement('button');button.type='button';button.dataset.view=key;button.textContent=title;nav.append(button)}document.querySelector('.brand').after(nav);
nav.id='workspace-menu';const menu=document.createElement('button');menu.type='button';menu.className='workspace-menu-toggle';menu.textContent='Abrir menu';menu.setAttribute('aria-controls',nav.id);menu.setAttribute('aria-expanded','false');document.querySelector('.brand').after(menu);menu.addEventListener('click',()=>{const open=document.querySelector('.side').classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Fechar menu':'Abrir menu'});
const quick=document.createElement('div');quick.className='workspace-shortcuts';quick.innerHTML='<button type="button" data-open="tasks">Organizar atividades</button><button type="button" data-open="library">Abrir biblioteca</button><button type="button" data-open="notes">Anotar uma ideia</button>';sections.overview.prepend(quick);
let active='overview';
function heading(){const [title,subtitle]=definitions[active];if($('heading').textContent!==title)$('heading').textContent=title;$('subtitle').textContent=subtitle;$('section-label').textContent='AION • SEU ESPAÇO PESSOAL'}
function show(key,focus=false){if(!definitions[key])key='overview';active=key;if(key==='overview')oldNav.querySelector('[data-tab=geral]').click();for(const [id,section] of Object.entries(sections))section.hidden=id!==key;for(const button of nav.children){button.classList.toggle('active',button.dataset.view===key);if(button.dataset.view===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')}heading();if(location.hash!=='#'+key)history.replaceState(null,'','#'+key);if(focus){$('heading').tabIndex=-1;$('heading').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}}
nav.addEventListener('click',e=>{if(e.target.dataset.view){show(e.target.dataset.view,true);document.querySelector('.side').classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.textContent='Abrir menu'}});quick.addEventListener('click',e=>{if(e.target.dataset.open)show(e.target.dataset.open,true)});
new MutationObserver(heading).observe($('heading'),{childList:true,characterData:true,subtree:true});
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
$('plan-new').addEventListener('click',()=>{show('tasks');$('task-name').focus()});$('plan-calendar').addEventListener('click',()=>{show('calendar');$('calendar-panel').scrollIntoView()});
// Keep area filtering on the activities screen; these buttons no longer navigate.
oldNav.addEventListener('click',()=>queueMicrotask(heading));
const panel=document.createElement('div');panel.className='notes-layout';panel.innerHTML=`
<section class="panel notes-editor"><h2 id="note-editor-heading">Nova anotação</h2><p class="hint">Uma ideia por nota. Lembretes aparecem no mural, sem notificações fora do AION.</p>
<form id="note-form"><label>Título<input id="note-title" required maxlength="120" placeholder="O que você quer guardar?"></label><label>Conteúdo<textarea id="note-text" rows="7" maxlength="10000" placeholder="Escreva uma ideia, dúvida ou próxima etapa…"></textarea></label><div class="note-fields"><label>Tipo<select id="note-kind"><option value="note">Anotação</option><option value="reminder">Lembrete</option></select></label><label>Data opcional<input id="note-date" type="date"></label></div><label class="note-pin"><input id="note-pinned" type="checkbox"> Fixar no topo</label><div class="note-actions"><button class="primary" type="submit">Salvar anotação</button><button id="note-cancel" type="button">Limpar editor</button></div></form><p id="note-status" role="status"></p></section>
<section class="panel notes-board"><h2>Meu mural</h2><div class="note-filters"><label>Pesquisar<input id="notes-search" type="search" placeholder="Buscar nas anotações"></label><label>Exibir<select id="notes-filter"><option value="all">Tudo</option><option value="note">Anotações</option><option value="reminder">Lembretes pendentes</option><option value="done">Lembretes concluídos</option><option value="pinned">Fixados</option></select></label></div><p id="notes-count" class="hint" aria-live="polite"></p><div id="notes-list"></div><details class="notes-protection"><summary>Proteção das anotações</summary><p id="notes-backup-status" role="status">Verificando cópia no computador…</p><p class="hint">Anotações têm cópia separada dos cadastros de atividades.</p><div class="note-actions"><button id="notes-export" type="button">Exportar anotações</button><button id="notes-backup" type="button">Salvar cópia no PC</button><button id="notes-restore" type="button">Restaurar cópia do PC</button></div></details></section>`;
sections.notes.append(panel);
const KEY='aion-notes-v1';let expected=null,data={version:1,items:[]},editing=null,locked=false,syncing=false,restoring=false,backupTimer;
function valid(d){return d&&d.version===1&&Array.isArray(d.items)&&d.items.length<=500&&new Set(d.items.map(n=>n?.id)).size===d.items.length&&d.items.every(n=>n&&typeof n.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(n.id)&&typeof n.title==='string'&&n.title.length>0&&n.title.length<=120&&typeof n.text==='string'&&n.text.length<=10000&&['note','reminder'].includes(n.kind)&&typeof n.date==='string'&&(!n.date||/^\d{4}-\d{2}-\d{2}$/.test(n.date))&&typeof n.pinned==='boolean'&&typeof n.done==='boolean'&&typeof n.updatedAt==='string')}
const say=t=>$('note-status').textContent=t,backupSay=t=>$('notes-backup-status').textContent=t;
try{expected=localStorage.getItem(KEY);if(expected){data=JSON.parse(expected);if(!valid(data))throw Error('invalid')}}catch(_){locked=true;data={version:1,items:[]};say('Não foi possível ler as notas. Exporte uma cópia para recuperação; nenhum conteúdo será substituído.')}
function clearEditor(){editing=null;$('note-form').reset();$('note-editor-heading').textContent='Nova anotação';$('note-cancel').textContent='Limpar editor'}
function commit(next){if(locked||restoring){say('Aguarde a restauração ou confira os dados antes de editar.');return false}if(localStorage.getItem(KEY)!==expected){say('As notas mudaram em outra janela. Exporte seu rascunho ou copie o texto antes de recarregar.');return false}try{if(!valid(next))throw Error('invalid');const raw=JSON.stringify(next);if(new TextEncoder().encode(raw).length>2900000)throw Error('size');localStorage.setItem(KEY,raw);expected=raw;data=next;render();say('Anotação salva neste navegador.');clearTimeout(backupTimer);backupTimer=setTimeout(sync,750);return true}catch(_){say('Não foi possível salvar. O texto continua no editor e suas notas anteriores foram preservadas.');return false}}
const normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function render(){const list=$('notes-list');list.replaceChildren();if(locked)return;const term=normal($('notes-search').value),filter=$('notes-filter').value;
 const items=data.items.filter(n=>normal(n.title+' '+n.text).includes(term)&&(filter==='all'||filter==='note'&&n.kind==='note'||filter==='reminder'&&n.kind==='reminder'&&!n.done||filter==='done'&&n.kind==='reminder'&&n.done||filter==='pinned'&&n.pinned)).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updatedAt.localeCompare(a.updatedAt));
 $('notes-count').textContent=items.length+' de '+data.items.length+' anotações';
 if(!items.length){const empty=document.createElement('p');empty.className='notes-empty';empty.textContent=data.items.length?'Nenhuma anotação neste filtro.':'Seu mural está livre. Guarde sua primeira ideia no editor.';list.append(empty)}
 for(const n of items){const card=document.createElement('article');card.className='note-card'+(n.pinned?' pinned':'');const title=document.createElement('h3');title.textContent=n.title;const meta=document.createElement('p');meta.className='hint';meta.textContent=(n.pinned?'Fixado · ':'')+(n.kind==='note'?'Anotação':n.done?'Lembrete concluído':'Lembrete pendente')+(n.date?' · '+n.date.split('-').reverse().join('/'):'');const body=document.createElement('p');body.className='note-body';body.textContent=n.text;const actions=document.createElement('div');actions.className='note-actions';
 const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);actions.append(b)};
 button('Editar',()=>{if(($('note-title').value||$('note-text').value)&&!confirm('Trocar o conteúdo do editor? O rascunho não salvo será descartado.'))return;editing=n.id;$('note-title').value=n.title;$('note-text').value=n.text;$('note-kind').value=n.kind;$('note-date').value=n.date;$('note-pinned').checked=n.pinned;$('note-editor-heading').textContent='Editar anotação';$('note-cancel').textContent='Cancelar edição';$('note-title').focus()});
 button(n.pinned?'Desafixar':'Fixar',()=>commit({version:1,items:data.items.map(x=>x.id===n.id?{...x,pinned:!x.pinned}:x)}));
 if(n.kind==='reminder')button(n.done?'Reabrir':'Concluir',()=>commit({version:1,items:data.items.map(x=>x.id===n.id?{...x,done:!x.done}:x)}));
 button('Excluir',()=>{if(confirm('Excluir esta anotação?')){if(commit({version:1,items:data.items.filter(x=>x.id!==n.id)})&&editing===n.id)clearEditor()}});
 card.append(meta,title,body,actions);list.append(card)}
}
$('note-form').addEventListener('submit',e=>{e.preventDefault();const title=$('note-title').value.trim();if(!title){say('Escreva um título.');return}const old=data.items.find(n=>n.id===editing);const item={id:editing||crypto.randomUUID(),title,text:$('note-text').value,kind:$('note-kind').value,date:$('note-date').value,pinned:$('note-pinned').checked,done:old?.done||false,updatedAt:new Date().toISOString()};if(item.kind==='note')item.done=false;const next={version:1,items:editing?data.items.map(n=>n.id===editing?item:n):[...data.items,item]};if(commit(next))clearEditor()});
$('note-cancel').addEventListener('click',()=>{if((!$('note-title').value&&!$('note-text').value)||confirm('Descartar o rascunho do editor?')){clearEditor();say('Editor limpo. As notas salvas continuam no mural.')}});
document.addEventListener('aion-note-material',event=>{const title=event.detail?.title;if(typeof title!=='string')return;if(($('note-title').value||$('note-text').value)&&!confirm('Abrir uma dúvida sobre este material? O rascunho atual será descartado.'))return;clearEditor();$('note-title').value=('Dúvida: '+title).slice(0,120);$('note-text').value='Material: '+title+'\n\nMinha dúvida:\n';show('notes',true);$('note-text').focus();say('Escreva sua dúvida e salve quando estiver pronto.');});
$('notes-search').addEventListener('input',render);$('notes-filter').addEventListener('change',render);
async function api(path,options){const response=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(10000),...options});if(!response.ok)throw Error('HTTP '+response.status);return response.json()}
async function write(d){const result=await api('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});if(!['salvo','sem alteracoes'].includes(result.status))throw Error('invalid')}
async function sync(){if(syncing||restoring||locked)return;if(localStorage.getItem(KEY)!==expected){backupSay('Notas alteradas em outra janela. Recarregue após preservar seu rascunho; esta janela não enviará uma cópia antiga.');return}syncing=true;const before=expected;try{const health=await api('/api/status');if(!health.notesSupported){backupSay('Notas salvas neste navegador. A cópia no PC ficará disponível após o próximo início do servidor; você pode exportar agora.');return}if(localStorage.getItem(KEY)!==expected)throw Error('conflict');await write(data);backupSay(before===expected?'Cópia das anotações salva no computador.':'Há alterações novas aguardando cópia.')}catch(_){backupSay('Notas continuam neste navegador. Não foi possível copiar para o PC; tente novamente ou exporte.')}finally{syncing=false;if(before!==expected){clearTimeout(backupTimer);backupTimer=setTimeout(sync,750)}}}
$('notes-backup').addEventListener('click',sync);
$('notes-export').addEventListener('click',()=>{const raw=locked?(localStorage.getItem(KEY)||''):JSON.stringify(data,null,2);const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='aion-anotacoes-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);say('Exportação solicitada. Confira o arquivo na pasta de downloads.')});
$('notes-restore').addEventListener('click',async()=>{if(syncing||restoring||locked){backupSay('Aguarde a gravação em andamento antes de restaurar.');return}restoring=true;clearTimeout(backupTimer);try{const latest=await api('/api/notes/latest');if(!valid(latest.data))throw Error('invalid');if(!confirm('Restaurar a cópia de anotações do PC? As notas atuais serão copiadas antes. O editor será limpo.'))return;const before=expected;if(localStorage.getItem(KEY)!==before)throw Error('conflict');await write(data);if(expected!==before||localStorage.getItem(KEY)!==before)throw Error('conflict');const raw=JSON.stringify(latest.data);localStorage.setItem(KEY,raw);data=latest.data;expected=raw;clearEditor();render();backupSay('Anotações restauradas. A versão anterior também foi copiada no PC.')}catch(_){backupSay('Restauração interrompida. Confira a conexão e a cópia; suas notas atuais foram preservadas.')}finally{restoring=false}});
window.addEventListener('storage',e=>{if(e.key===KEY)say('As notas mudaram em outra janela. Preserve seu rascunho antes de recarregar.')});
window.addEventListener('online',()=>{if(data.items.length)sync()});
setInterval(()=>{if(document.visibilityState==='visible'&&data.items.length)sync()},60000);
render();show(location.hash.slice(1));
// An empty browser must not replace an existing notebook backup on startup.
if(data.items.length)sync();else api('/api/status').then(health=>{if(!health.notesSupported){backupSay('A cópia no PC ficará disponível após o próximo início do servidor. Você pode usar e exportar notas localmente.');return}return api('/api/notes/latest').then(()=>backupSay('Há uma cópia de anotações no PC. Use Restaurar para recuperá-la.')).catch(()=>backupSay('Suas notas serão copiadas automaticamente após salvar.'))}).catch(()=>backupSay('Servidor indisponível. Você pode usar e exportar notas neste navegador.'));
})();
