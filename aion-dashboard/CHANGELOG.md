# AION Dashboard

## 0.5.4 — 2026-11-09

Layout responsivo corrigido: Radar sem rótulos cortados, painéis em uma coluna até 1100px, campo de nome com largura mínima e gráfico sem deformação do texto. Cache estático atualizado. Pacote cumulativo com as correções de restauração 0.5.3.

Iniciador Windows abrir_aion.py versionado, com guia para preservar o atalho/perfil Edge. O inicializador permanece fora do pacote da aplicação; o AutoUpdate não o sobrescreve. Nenhum atalho pessoal ou perfil foi publicado.

Testes de layout passaram em 320, 390, 750, 950, 1100 e 1440px; Chrome headless isolado validou snapshots, persistência, restauração, falha HTTP 500 e offline. Iniciador testado com servidor real em porta isolada; abertura do Edge registrada sem tocar perfil pessoal. Reinício do Windows não realizado. Comando de desligamento do servidor principal bloqueado pela revisão automática.

## 0.5.3 — 2026-11-09

Restauração interrompida se o backup preventivo falhar. Bloqueio de operações concorrentes, validação de dados e tentativa de reversão de escritas parciais. Estado sem snapshots explicitado na interface. Cache estático atualizado.

Fontes da aplicação em app/; scripts Windows em windows/. O pacote de atualização contém index.html, protecao.js, sw.js, README.md e aion-version.json. Os demais recursos da instalação 0.5.2 são preservados. Scripts Windows são distribuídos separadamente e não são executados a partir do pacote remoto.

Backup de código usa lista explícita de arquivos e SHA-256, sem snapshots pessoais. Agendamento recupera horários perdidos e permite bateria, exigindo usuário conectado. Atualizador v1.1 calcula hashes via .NET, resolve a instalação pelo diretório do script, evita colisões de nomes de backup e valida o caminho antes de limpar staging. Validação de sintaxe Python evita aspas internas no comando nativo do Windows.

Para instalações existentes, copiar os arquivos de windows/ para _automacao/ após backup e executar Ativar-Backup-Diario.ps1. Depois executar Atualizar-AION-Automatico.ps1. A instalação local usada na validação já recebeu os scripts.

Validação anterior à publicação: 11 cenários de restauração; Chrome headless isolado com persistência, snapshots, restauração, falha HTTP 500, viewport móvel e offline; isolamento de dados nos ZIPs; AutoUpdate em cópia isolada com hash incorreto, rollback após falha de estado, upgrade 0.5.2→0.5.3, repetição e bloqueio de downgrade. Os testes do pacote podem ser repetidos com `python aion-dashboard/tests/release.py` e `node aion-dashboard/tests/restore.cjs` na raiz do repositório.

Limites: sem validação em aparelhos físicos, instalação PWA pelo sistema, HTTPS, leitores de tela ou queda de energia. Reversão de localStorage é tentativa; backup preventivo em disco é a salvaguarda se o armazenamento continuar falhando. Não contém dados pessoais nem perfis de navegador.

Rollback: conservar os ZIPs AION-Antes-AutoUpdate e o backup dos scripts Windows. Extrair primeiro em diretório separado, conferir conteúdo e restaurar somente código e estado correspondentes. A atualização automática recusa downgrade; não alterar o canal silenciosamente para mascarar isso. Dados pessoais não devem ser substituídos no rollback de código.


## 0.5.5 — Biblioteca privada de estudos

Biblioteca local com pesquisa sem acentos, filtro por área, contagem de arquivos disponíveis e abertura das cópias PDF. Interface responsiva com controles de pelo menos 44px, foco visível, limpeza de filtros e mensagens de falha que preservam a lista anterior.

O catálogo e os materiais ficam em _materiais_estudo, fora da pasta de código. Nenhum material pessoal integra este pacote. A biblioteca não altera atividades, notas ou sessões. A configuração local ativo.json aponta para uma pasta de catálogo; sem catálogo, a biblioteca fica vazia.

O servidor só atende arquivos PDF registrados no catálogo e dentro da pasta copias. Respostas da biblioteca não expõem caminhos de disco. Arquivos e API não entram no cache offline. A atualização não reinicia o computador nem o servidor já aberto: a nova API passa a funcionar no próximo início do servidor. O painel orienta quando encontra o servidor anterior.

Validação: Chrome em perfil isolado; pesquisa/filtros, contagens, arquivo ausente, erro 500, orientação 404, AbortError simulado e recuperação; bloqueio de origem externa e de caminhos fora da biblioteca; backup/restauração e falhas; larguras 320 a 1440px. Sem validação em aparelho móvel físico. Distribuição contém somente código e ícones.
