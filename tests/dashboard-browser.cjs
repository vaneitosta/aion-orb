/* AION Dashboard: E2E regression tests (isolated from AION Orb).
 * Run: npm install --no-save playwright && npx playwright install chromium webkit
 *      AION_BROWSER=chromium node tests/dashboard-browser.cjs
 *      AION_BROWSER=webkit node tests/dashboard-browser.cjs
 */
'use strict';
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const { readFile, mkdir } = require('node:fs/promises');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const root = path.resolve(__dirname, '..', 'docs');
const types = {'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.js':'text/javascript'};
const server = http.createServer(async(req,res)=>{
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const rel = pathname.endsWith('/') ? pathname+'index.html' : pathname;
    const filename = path.resolve(root,'.'+rel);
    if (!filename.startsWith(root+path.sep)) { res.writeHead(403).end(); return; }
    const file = await readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(file);
  } catch (_) {res.writeHead(404).end('Not found');}
});
const BROWSER=process.env.AION_BROWSER==='webkit'?'webkit':'chromium';
const engine=BROWSER==='webkit'?webkit:chromium;
let passed=0;
function ok(message){++passed;console.log('PASS '+BROWSER+' '+message);}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const browser=await engine.launch({headless:true});
  try {
    const {devices} = require('playwright');
    const profiles = BROWSER==='webkit'
      ? [{name:'safari-mobile',options:devices['iPhone 13']}]
      : [
        {name:'android-mobile',options:devices['Pixel 5']},
        {name:'desktop',options:{viewport:{width:1440,height:900}}}
      ];
    for (const profile of profiles){
      const context=await browser.newContext({...profile.options,acceptDownloads:true});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      const resp=await page.goto(base+'dashboard/',{waitUntil:'load'});
      assert.equal(resp.status(),200);
      assert.match(await page.title(),/AION \| Dashboard/);
      assert.match(await page.locator('#heading').innerText(),/Seu panorama/);
      ok(profile.name+' startup');
      for (const [tab,title] of [
        ['calendario','Seu tempo'],['semana','Sua semana'],['estudos','Estudos em evolução'],
        ['projetos','Projetos em movimento'],['trabalho','Trabalho'],
        ['geral','Seu panorama']
      ]){
        await page.locator('[data-tab="'+tab+'"]').click();
        assert.match(await page.locator('#heading').innerText(),new RegExp(title));
      }
      ok(profile.name+' tab navigation');

      await page.locator('[data-tab="calendario"]').click();
      const today=await page.evaluate(()=>{
        const d=new Date();
        return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      });
      await page.locator('[data-day="'+today+'"]').first().click();
      await page.locator('#cal-task-name').fill('Revisar Direito');
      await page.locator('#cal-task-type').selectOption('estudos');
      await page.locator('#cal-task-priority').selectOption('high');
      await page.locator('#calendar-task-form button[type=submit]').click();
      assert.match(await page.locator('#day-list').innerText(),/Revisar Direito/);
      let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.tasks.length,1);
      assert.equal(state.tasks[0].due,today);
      assert.equal(state.tasks[0].priority,'high');
      ok(profile.name+' calendar scheduling');
      await page.locator('[data-tab="geral"]').click();
      assert.match(await page.locator('#next-action-title').innerText(),/Prazo de hoje: Revisar Direito/);
      await page.locator('#next-action-button').click();
      assert.match(await page.locator('#heading').innerText(),/Seu tempo, organizado/);
      ok(profile.name+' next-action guidance and calendar navigation');

      await page.reload();
      await page.locator('[data-tab="geral"]').click();
      assert.match(await page.locator('#upcoming').innerText(),/Revisar Direito/);
      await page.locator('#upcoming [data-complete]').first().click();
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.tasks[0].done,true);
      ok(profile.name+' persistence and task completion');

      await page.locator('[data-tab="estudos"]').click();
      await page.locator('#study-subject').fill('Português');
      await page.locator('#study-total').fill('9');
      await page.locator('#study-correct').fill('7');
      await page.locator('#study-form button[type=submit]').click();
      assert.match(await page.locator('#study-summary').innerText(),/78%/);
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.studies.length,1);
      await page.locator('#study-subject').fill('Inválido');
      await page.locator('#study-total').fill('4');
      await page.locator('#study-correct').fill('8');
      await page.locator('#study-form button[type=submit]').click();
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.studies.length,1,'must reject correct > questions');
      ok(profile.name+' study statistics and validation');

      await page.locator('[data-tab="projetos"]').click();
      await page.locator('#task-name').fill('Finalizar AION');
      await page.locator('#task-priority').selectOption('high');
      await page.locator('#task-form button[type=submit]').click();
      assert.match(await page.locator('#task-list').innerText(),/Finalizar AION/);
      await page.locator('#task-name').fill('<img src=x onerror=alert(1)>');
      await page.locator('#task-form button[type=submit]').click();
      assert.equal(await page.locator('#task-list img').count(),0,'task HTML must be escaped');
      ok(profile.name+' projects and HTML injection protection');

      const downloadPromise=page.waitForEvent('download');
      await page.locator('#export').click();
      const download=await downloadPromise;
      assert.match(download.suggestedFilename(),/\.json$/);
      const payload=JSON.parse(await readFile(await download.path(),'utf8'));
      assert.equal(payload.tasks.length,3);
      assert.equal(payload.studies.length,1);
      page.once('dialog',d=>d.accept());
      await page.locator('#clear').click();
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.tasks.length,0);
      page.once('dialog',d=>d.accept());
      await page.locator('#import').setInputFiles({
        name:'aion-backup.json',mimeType:'application/json',
        buffer:Buffer.from(JSON.stringify(payload))
      });
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')).tasks.length===3);
      ok(profile.name+' JSON backup export/import');

      await page.locator('[data-tab="semana"]').click();
      assert.equal(await page.locator('#week-grid .week-card').count(),7);
      assert.match(await page.locator('#week-metrics').innerText(),/Previstas/);
      const initialWeek=await page.locator('#week-range').innerText();
      await page.locator('#week-next').click();
      assert.notEqual(await page.locator('#week-range').innerText(),initialWeek);
      await page.locator('#week-prev').click();
      assert.equal(await page.locator('#week-range').innerText(),initialWeek);
      await page.locator('#week-current').click();
      assert.equal(await page.locator('#week-task-date').inputValue(),today);
      ok(profile.name+' week navigation and day selection');

      await page.locator('#week-task-name').fill('Planejar pesquisa');
      await page.locator('#week-task-type').selectOption('estudos');
      await page.locator('#week-task-priority').selectOption('high');
      await page.locator('#week-form button[type=submit]').click();
      assert.match(await page.locator('#week-day-tasks').innerText(),/Planejar pesquisa/);
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.tasks.length,4);
      assert.equal(state.tasks.find(t=>t.name==='Planejar pesquisa').due,today);
      assert.match(await page.locator('#week-metrics').innerText(),/Concluídas/);
      await page.locator('#week-day-tasks [data-complete]').first().click();
      state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aion-dashboard-local-v2')));
      assert.equal(state.tasks.find(t=>t.name==='Planejar pesquisa').done,true);
      await page.locator('[data-week-open="'+today+'"]').click();
      assert.match(await page.locator('#day-list').innerText(),/Planejar pesquisa/);
      ok(profile.name+' weekly task creation, completion, calendar link');
      await page.locator('[data-tab="semana"]').click();
      const weekLayout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(weekLayout.scrollWidth<=weekLayout.width+2,'Weekly horizontal overflow '+JSON.stringify(weekLayout));
      if(profile.name!=='desktop'){
        const wFont=await page.locator('#week-task-name').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
        assert.ok(wFont>=16,'Week form text size below 16px on mobile');
      }
      ok(profile.name+' weekly responsive layout');


      await page.locator('[data-tab="estudos"]').click();
      const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:window.innerWidth}));
      assert.ok(layout.scrollWidth<=layout.width+2,JSON.stringify(layout));
      assert.deepEqual(errors,[],'uncaught JS errors');
      if(profile.name!=='desktop'){
        const font=await page.locator('#study-subject').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
        assert.ok(font>=16,'iPhone inputs below 16px may zoom on focus: '+font);
      }
      ok(profile.name+' viewport, font sizing, no JS errors');

      await mkdir('dashboard-test-artifacts',{recursive:true});
      await page.screenshot({path:'dashboard-test-artifacts/'+BROWSER+'-'+profile.name+'.png',fullPage:true});
      await context.close();
    }
    const orbResponse=await fetch(base);
    assert.equal(orbResponse.status,200);
    assert.match(await orbResponse.text(),/Aion Orb/);
    const manifest=await fetch(base+'dashboard/manifest.webmanifest');
    assert.equal(manifest.status,200);
    assert.equal((await manifest.json()).display,'standalone');
    ok('orb preserved and dashboard manifest present');
    console.log('AION Dashboard '+BROWSER+': '+passed+' checks passed');
  } finally {await browser.close();}
})().catch(error=>{console.error('FAIL '+BROWSER,error);process.exitCode=1;})
 .finally(()=>server.close());
