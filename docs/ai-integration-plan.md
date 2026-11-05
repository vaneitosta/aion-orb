# AION Orb — integração de IA (fase inicial)

## Estado atual
O site é estático e publicado no GitHub Pages. Comandos de tarefas, notas e agenda continuam funcionando localmente. A IA remota ainda não está conectada.

## Arquitetura decidida
1. Interface do AION Orb envia somente a mensagem explicitamente enviada pelo usuário para um endpoint HTTPS.
2. Um backend separado autentica a chamada ao provedor de IA. A chave da API fica exclusivamente em segredo de servidor, nunca no JavaScript público nem no repositório.
3. O backend limita tamanho, frequência, tempo de resposta e custos; não registra conteúdo de mensagens.
4. O usuário deve poder manter o modo local, sem enviar dados à IA. Histórico, tarefas e backups locais não serão transmitidos automaticamente.
5. O backend devolve apenas o texto de resposta; comandos que alteram tarefas permanecem locais e requerem confirmação quando aplicável.

## Próximas etapas de implementação
- Escolher e configurar hospedagem segura para o backend, com autenticação de usuário e restrição de origem. CORS isoladamente não autentica usuários.
- Criar endpoint POST /api/chat, com validação, limitação de requisições, timeout e tratamento de erros.
- Adicionar configuração explícita de IA remota na interface e indicador de envio de dados.
- Criar testes com provedor simulado, sem gastar tokens nem expor chaves.
- Validar no WebKit e Chromium móveis; depois fazer validação final no Safari de um iPhone físico.

## Restrições
Não incluir credenciais no GitHub Pages. Não alterar o Projeto Sincronia. Não anunciar IA funcional antes de configurar backend e confirmar testes reais.
