# AION Dashboard v0.6 — transferência protegida

O dashboard funciona em modelo local-first. Os registros continuam no `localStorage` do navegador sob a chave `aion-dashboard-local-v2`. Não há sincronização automática entre dispositivos, serviço remoto de armazenamento, conta ou autenticação.

## Backup protegido

- Criptografia do conteúdo exportado: AES-256-GCM via Web Crypto API, com IV de 96 bits gerado aleatoriamente.
- Derivação da chave da senha: PBKDF2-SHA256, 310.000 iterações, salt aleatório de 128 bits.
- Formato: JSON com envelope `aion-dashboard-encrypted`, versão 1, salt, IV, parâmetros de derivação e texto cifrado em base64.
- A senha nunca é adicionada ao arquivo nem gravada em `localStorage`; senha perdida significa backup irrecuperável.
- O arquivo protegido pode ser transferido manualmente por AirDrop, Arquivos, e-mail ou serviço escolhido pelo usuário. Evite enviar a senha junto com o arquivo.
- O compartilhamento nativo do navegador pode não ser suportado ou não preservar o gesto do usuário; nesse caso, o dashboard baixa o arquivo protegido.
- Importar oferece **Mesclar** (adiciona apenas IDs que não existem neste navegador, preservando conflitos locais) ou **Substituir** (exige confirmação e apaga os registros anteriores no navegador).
- Arquivos legados sem criptografia continuam disponíveis para compatibilidade, devidamente identificados como inseguros para compartilhamento.

## Limitações de segurança

- Os dados ativos no navegador ainda **não são criptografados em repouso**; dispositivos comprometidos, extensões maliciosas ou scripts que executem na mesma origem podem acessá-los.
- A criptografia protege **apenas o arquivo de backup**, não os dados exibidos enquanto o dashboard está aberto.
- Não existe backup remoto automático nem recuperação de senha.
- Para sincronização contínua futura será preciso um backend com autenticação por usuário, autorização de acesso por registro (por exemplo RLS), armazenamento remoto e resolução de conflitos. Nunca publicar chaves privilegiadas na aplicação web.
- Este mecanismo não substitui um serviço gerenciado de segurança nem uma auditoria independente.

## Testes automáticos

A suíte `tests/dashboard-browser.cjs` cobre exportação criptografada sem dados em claro, senha inválida sem mutação, importação em navegador isolado, mesclagem e substituição confirmada; executa em Chromium e WebKit, além das verificações de regressão do dashboard e preservação do orb.
