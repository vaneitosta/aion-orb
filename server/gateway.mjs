import {createServer} from 'node:http';

const origin = process.env.AION_ALLOWED_ORIGIN || 'https://vaneitosta.github.io';
const port = Number(process.env.PORT || 8787);
const model = process.env.AION_MODEL || 'gpt-4.1-mini';

function reply(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  });
  res.end(JSON.stringify(data));
}

export const server = createServer(async (req, res) => {
  if (req.headers.origin !== origin) {
    res.writeHead(403); res.end(); return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    });
    res.end(); return;
  }
  if (req.url !== '/api/chat' || req.method !== 'POST') {
    reply(res, 404, {error:'Rota não encontrada'}); return;
  }
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 8192) {
        reply(res, 413, {error:'Solicitação muito grande'}); return;
      }
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (typeof data.message !== 'string' || !data.message.trim() || data.message.length > 4000) {
      reply(res, 400, {error:'Mensagem inválida'}); return;
    }
    if (!process.env.OPENAI_API_KEY) {
      reply(res, 503, {error:'Integração de IA ainda não configurada'}); return;
    }
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        instructions: 'Você é AION Orb. Responda em português brasileiro. Não afirme executar ações que não executou.',
        input: data.message,
        max_output_tokens: 350
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) {
      reply(res, 502, {error:'Serviço de IA indisponível'}); return;
    }
    const result = await upstream.json();
    const answer = (result.output || []).flatMap(x => x.content || [])
      .filter(x => x.type === 'output_text').map(x => x.text).join('\n').trim();
    reply(res, answer ? 200 : 502, answer ? {answer} : {error:'Resposta vazia'});
  } catch (error) {
    reply(res, error instanceof SyntaxError ? 400 : 504,
      {error: error instanceof SyntaxError ? 'JSON inválido' : 'Falha na consulta'});
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => console.log('AION gateway listening on ' + port));
}
