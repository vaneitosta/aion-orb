# AION Dashboard — Diretrizes de desenvolvimento (inspiradas no Projeto Sincronia)

Versão: 2026-11-09. Aplicável **somente ao AION Dashboard**.
Referência consultada: `vaneitosta/projeto-sincronia` (README e atualização técnica de 28/10/2026).
**Não modificar, migrar, publicar ou sobrescrever o Projeto Sincronia.**

## 1. Princípio orientador
**Inteligência para compreender. Autonomia para executar. Competência para entregar. Continuidade para evoluir.**
Entregar trabalho verificável; não relatar resultados imaginários ou concluir que algo funciona com base apenas no aspecto visual.

## 2. Limites de acesso e autonomia
- Operar exclusivamente na pasta local `%USERPROFILE%\AION Visual Lab\AION-Dashboard` e, para distribuição, na branch `dashboard-updates` do repositório `vaneitosta/aion-orb`.
- A pasta `Projeto Sincronia`, suas revisões e o repositório `vaneitosta/projeto-sincronia` são de **somente leitura**, como referência.
- Pode implementar correções rotineiras, testes e backups no AION com autonomia. Antes de operações destrutivas, exposição pública de dados, alterações de permissões, instalação de dependências ou ações externas irreversíveis, solicitar autorização específica.
- Não pedir senhas ou tokens no chat. Não instalar ferramentas de acesso remoto nem conceder permissões administrativas amplas.
- Não assumir que o ChatGPT na web tem acesso ao disco C:; validar qualquer ação local com evidências.

## 3. Fonte de verdade e versões
- Conferir os arquivos realmente presentes antes de mudar o código; não usar cópias antigas como fonte sem comparação.
- Preservar uma cópia de segurança, com timestamp e hashes SHA-256, antes de alterar código/infraestrutura. Manter backups fora do diretório sobrescrito.
- Usar Git e histórico de alterações; não fazer commits ou publicação no Sincronia. Não modificar a branch `main` do `aion-orb` para distribuir o Dashboard.
- Registrar versão, mudanças, testes realizados, limitações e rollback no CHANGELOG/relatório.
- Não alterar dados pessoais como parte de testes; usar dados sintéticos em perfil/ambiente isolado.

## 4. Experiência, design e acessibilidade
- Preservar a identidade do AION, responsividade para desktop, iOS e Android; priorizar legibilidade e controle de informação.
- Suportar teclado, foco visível, rótulos acessíveis, alto contraste, redução de movimento e leitores de tela; não alegar conformidade WCAG sem auditoria.
- Preferências de áudio/vibração desativadas por padrão, com controles explícitos.
- Respeitar economia de dados e hardware limitado; evitar animações excessivas, carregar recursos sob demanda.
- Não misturar texto e elementos de interface que dificultem compreensão; alertas claros e sem excesso de notificações.

## 5. Privacidade e segurança
- Coletar somente dados necessários; evitar rastreamento, analytics e cookies não essenciais por padrão.
- Dados de estudos, trabalho, tarefas e sessões são privados. Não enviar para GitHub público, logs ou serviços terceiros.
- Separar backups de **código** e **dados pessoais**. Backup automático de código não comprova recuperação de cadastros.
- Exigir consentimento e escopo mínimo para integrações Google, Microsoft, Spotify, mensageria, e armazenar segredos fora do repositório.
- Verificar entradas e permissões; limitar servidor a `127.0.0.1` quando a função for apenas local. Evitar execução de expressões de usuário como código.

## 6. Testes e critérios de aceite
- Conferir sintaxe, funções críticas, regressões, acessibilidade básica, rotas, backups e restauração real.
- Validar estados de sucesso, erro, cancelamento e operações simultâneas; não presumir que HTTP 200 prova toda a aplicação.
- Testar layout desktop e celular com navegadores, e separar simulação/emulação de testes físicos em Safari/iOS, Chrome/Android, NVDA/TalkBack/VoiceOver.
- Para service workers/PWA, testar em localhost e HTTPS; abertura por `file://` não substitui teste de instalação/offline.
- Uma versão só é marcada validada depois de evidências dos fluxos críticos. Documentar o que não foi possível testar.

## 7. Atualizações e rollback
- Canal remoto: branch `dashboard-updates`, manifesto `aion-dashboard/channel/stable.json`, pacote versionado em `aion-dashboard/releases/<versão>/`.
- Distribuir recursos completos **antes** de atualizar o manifesto para a nova versão; conferir SHA-256 e versão antes da instalação.
- Fazer backup local antes da troca, aplicar mudanças atomicamente quando possível, reiniciar serviço somente após validação e restaurar versão anterior em falha.
- Não incluir arquivos de dados pessoais, `_backups_dados`, segredos, ambientes Python/Node nem `.git` nos pacotes públicos.
- Verificar prevenção de versões antigas, cache do navegador/PWA e compatibilidade com backups de dados.

## 8. Checklist de cada entrega
1. Identificar origem e versão instalada.
2. Criar backup e registrar hashes.
3. Modificar somente arquivos autorizados.
4. Rodar testes estáticos, funcionais e de regressão.
5. Validar restauração de dados quando aplicável.
6. Documentar erros conhecidos, limitações e rollback.
7. Publicar somente no canal do AION, quando autorizado e testado.
8. Verificar o resultado no computador/navegador, sem confundir preparação com instalação.

## 9. Regras do Sincronia que NÃO são transplantadas literalmente
- Conteúdo editorial de mensagens, paletas, temas, formatos de cartão e compartilhamento pertencem ao Sincronia.
- A estrutura estática sem backend do Sincronia não obriga o AION a abrir mão de seu servidor local de backups.
- Não replicar marcas, arquivos privados nem código do Sincronia sem necessidade técnica e autorização.

Fonte de referência: https://github.com/vaneitosta/projeto-sincronia
