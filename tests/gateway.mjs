import assert from 'node:assert/strict';
import {once} from 'node:events';


process.env.NODE_ENV = 'test';
delete process.env.OPENAI_API_KEY;
const {server} = await import('../server/gateway.mjs');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
try {
  const denied = await fetch(base + '/api/chat', {
    method:'POST', headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},
    body:JSON.stringify({message:'Olá'})
  });
  assert.equal(denied.status,403);
  const valid = await fetch(base + '/api/chat', {
    method:'POST', headers:{Origin:'https://vaneitosta.github.io','Content-Type':'application/json'},
    body:JSON.stringify({message:'Olá'})
  });
  assert.equal(valid.status,503);
  assert.match((await valid.json()).error,/não configurada/);
  const invalid = await fetch(base + '/api/chat', {
    method:'POST', headers:{Origin:'https://vaneitosta.github.io','Content-Type':'application/json'},
    body:JSON.stringify({message:''})
  });
  assert.equal(invalid.status,400);
  console.log('AI gateway baseline tests: PASS');
} finally {
  server.close();
  await once(server,'close');
}
