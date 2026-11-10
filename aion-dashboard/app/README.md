# AION Dashboard v0.5 — Fundação multiplataforma

Projeto independente do Sincronia, da Microsoft e de contas externas. Não modifica nenhum repositório.

## Como executar

No Windows, use o lançador instalado (PowerShell):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\AION Visual Lab\AION-Dashboard\_automacao\Iniciar-AION.ps1"
```

Acesse **http://127.0.0.1:5500/**, sempre no mesmo perfil do navegador. O servidor `servidor_aion.py` fornece a API de proteção. Abrir por `file://` ou usar `python -m http.server` não fornece essa API. Mudar host, porta ou perfil muda o armazenamento do navegador.

### O que esta versão oferece

- Painel de tarefas, calendário, planejamento e histórico de estudos mantidos da v0.4.
- Calculadora aritmética local com parênteses e porcentagem, sem `eval`.
- Cronômetro de concentração com iniciar/pausar/retomar/reiniciar, áreas de uso e histórico de sessões **concluídas** salvo no navegador.
- Instalação PWA preparada com `manifest.webmanifest`, ícones 192/512 e cache estático por service worker.
- Backup JSON com tarefas, sessões de estudo e histórico de foco; importação de backups anteriores; sem sincronização com serviços externos.
- Verificação visível do contexto seguro, armazenamento e configuração offline.

### Privacidade e limites

Os dados são guardados em `localStorage` **sem criptografia** e são específicos de cada origem/perfil/navegador. Não armazene senhas, tokens ou dados confidenciais. Limpar os dados do navegador pode apagar os registros. Exporte backups regularmente e guarde-os com cuidado. O modo foco silencia apenas avisos internos do AION; não ativa o Não Perturbe do sistema. O cronômetro não é um serviço de segundo plano e uma aba encerrada interrompe o acompanhamento. O painel **ainda não possui** cadastro de usuários, login, sincronização entre dispositivos, banco de dados na nuvem nem conectores externos.

### Organização dos arquivos

`index.html` — interface HTML; `styles.css` — estilos; `legacy.js` — funcionalidades existentes até v0.4; `tools.js` — calculadora, foco e status de instalação; `manifest.webmanifest` — metadados de PWA; `sw.js` — cache offline de arquivos estáticos; `icons/` — ícones.

### Testes realizados

- `node --check` em `legacy.js` e `tools.js`: passaram.
- 16 testes no Chromium com HTML carregado diretamente: carregamento, cálculo, rejeição de expressão perigosa, cadastro/conclusão de tarefa, controle do cronômetro, exportação JSON e responsividade 390 px: **16/16**.
- Armazenamento simulado no navegador de teste; por isso os testes não comprovam persistência real entre recargas.
- HTTP local bloqueado por política do ambiente de execução; instalação, cache do service worker e abertura offline **não foram validados em navegador real**.
- Não testado em iPhone, Android, Windows nem Linux físicos; instalabilidade multiplataforma é uma capacidade projetada, não certificação.

### Etapa obrigatória antes de conectar contas pessoais

Hospedar por HTTPS, validar PWA/offline em aparelhos reais, automatizar testes de persistência e migração, definir autenticação e armazenamento seguro, implementar autorização OAuth com escopos mínimos e política de revogação. Evitar colocar tokens de serviço em `localStorage`.


## Atualização v0.5.1 — proteção local

O novo `servidor_aion.py` atende a página no loopback `127.0.0.1:5500` e cria snapshots JSON versionados em `../_backups_dados`. A API local não tem integração com nuvem nem acesso via rede. Eventos de alteração acionam o backup; na interface há também os botões **Salvar dados no PC** e **Restaurar último backup**. O backup diário contém somente código. Os snapshots pessoais permanecem separados em `_backups_dados`; preserve essa pasta em um backup privado do dispositivo.

Os snapshots não são criptografados. Evite inserir dados sigilosos sem proteção do dispositivo e backup externo. Para preservar dados do navegador v0.5, continue usando `http://127.0.0.1:5500` (porta e host idênticos). A instalação Windows usa `Atualizar-AION.cmd` do pacote.


## Atualização 0.5.3 — restauração protegida

A restauração só prossegue após confirmação de gravação dos dados atuais no PC. Operações simultâneas são bloqueadas; alterações durante o salvamento interrompem a restauração. Falhas de armazenamento tentam reverter as escritas parciais, mantendo também a cópia preventiva no PC. Um painel vazio informa quando ainda não existe snapshot; nenhum cadastro pessoal é inventado ou migrado automaticamente.

O backup de código das 20h recupera horários perdidos quando possível e pode executar em bateria, com o usuário conectado. Isso não captura localStorage de um navegador fechado. ZIPs antigos podem conter dados: a separação aplica-se aos novos backups.

O código da versão 0.5.3 e os scripts Windows estão versionados em `aion-dashboard/` no branch `dashboard-updates`. O pacote do AutoUpdate atualiza os cinco arquivos alterados da aplicação; os scripts Windows ficam fora da lista permitida do atualizador e são distribuídos separadamente em `windows/`. Instalações anteriores precisam copiar os scripts de backup corrigidos para `_automacao` e executar `Ativar-Backup-Diario.ps1`; a instalação local usada na validação já recebeu essas correções.


## Atualização 0.5.4 — layout e inicialização

Radar adapta a quantidade de colunas à largura disponível; janelas estreitas exibem os painéis em uma coluna. Os rótulos não ficam espremidos e o gráfico mantém as proporções do texto.

O iniciador `windows/abrir_aion.py`, instalado em `_automacao`, verifica o servidor local, inicia-o quando necessário e abre `_automacao/AION-Edge.lnk`. Esse atalho interno preserva o aplicativo e o perfil Edge originais. O atalho da Área de Trabalho chama o iniciador com o Python existente. Consulte `windows/ATALHO.md` no repositório para configuração e teste após reiniciar.

O pacote 0.5.4 inclui seis arquivos da aplicação e incorpora a proteção de restauração 0.5.3. Scripts Windows ficam versionados separadamente, fora da lista de arquivos substituídos pelo AutoUpdate. Não inclui atalhos específicos do computador, perfis ou dados pessoais.


## 0.5.5 — Biblioteca privada de estudos

Biblioteca local com pesquisa sem acentos, filtro por área, contagem de arquivos disponíveis e abertura das cópias PDF. Interface responsiva com controles de pelo menos 44px, foco visível, limpeza de filtros e mensagens de falha que preservam a lista anterior.

O catálogo e os materiais ficam em _materiais_estudo, fora da pasta de código. Nenhum material pessoal integra este pacote. A biblioteca não altera atividades, notas ou sessões. A configuração local ativo.json aponta para uma pasta de catálogo; sem catálogo, a biblioteca fica vazia.

O servidor só atende arquivos PDF registrados no catálogo e dentro da pasta copias. Respostas da biblioteca não expõem caminhos de disco. Arquivos e API não entram no cache offline. A atualização não reinicia o computador nem o servidor já aberto: a nova API passa a funcionar no próximo início do servidor. O painel orienta quando encontra o servidor anterior.

Validação: Chrome em perfil isolado; pesquisa/filtros, contagens, arquivo ausente, erro 500, orientação 404, AbortError simulado e recuperação; bloqueio de origem externa e de caminhos fora da biblioteca; backup/restauração e falhas; larguras 320 a 1440px. Sem validação em aparelho móvel físico. Distribuição contém somente código e ícones.


## 0.5.6 — Planejar estudo a partir de um material

Botão Planejar estudo em cada material disponível. Cria atividade de Estudos pendente, sem prazo, somente após clique. Evita duplicar o mesmo material ou título, preserva o rascunho do formulário e não registra sessões nem conclusões. Gravação falha mantém a lista anterior; conflitos detectados entre janelas exigem recarga. A atividade usa o backup de dados existente e preserva o identificador do material.

Testado com dados sintéticos: criação, duplicação, rascunho, PDF ausente, snapshot real, falha de armazenamento, conflito entre janelas e recarga. Regressão de biblioteca, filtros, restauração, falhas, offline e seis larguras aprovada. Materiais pessoais não são distribuídos. O servidor já aberto não é interrompido; ativação da biblioteca continua dependendo de seu próximo início.


## 0.5.7 — Reconexão do backup automático

Ao abrir sem servidor ou após falha de gravação, o AION tenta recuperar a proteção quando a conexão volta, ao retornar à janela e a cada 30 segundos enquanto visível. Eventos simultâneos compartilham uma tentativa. Requisições têm limite de dez segundos. Dados locais pendentes são salvos após reconectar; navegador vazio não sobrescreve um backup existente automaticamente. Não reinicia computador nem servidor.

Testado em Chrome isolado: abertura offline e recuperação sem recarga, falha de gravação preservando dados, salvamento real após reconexão e eventos concorrentes sem duplicar gravações. Regressões de planejamento, biblioteca, backup/restauração, offline e layout passaram. Intervalos de 30 segundos e limite real de dez segundos não foram cronometrados. Materiais e cadastros não acompanham o pacote.


## 0.6.0 — Áreas organizadas, caderno e mural

Oito áreas separadas: Visão geral, Atividades, Estudos, Biblioteca, Agenda, Anotações, Ferramentas e Proteção dos dados. Uma área visível por vez; menu lateral no desktop e recolhível no celular. A identidade escura foi preservada, com controles maiores, rótulos e foco visível. Atividades continuam filtráveis por área.

Caderno com título, texto, busca, edição, fixação e exclusão confirmada. Lembretes têm data opcional e conclusão manual, sem notificações externas. O botão Anotar dúvida da biblioteca prepara um rascunho referenciando o material; nenhum texto é salvo automaticamente antes de confirmar.

Notas são locais na chave aion-notes-v1 e têm exportação JSON própria e snapshots separados em _backups_anotacoes. O backup de atividades existente permanece compatível e não inclui o caderno. Restauração do caderno exige copiar a versão atual primeiro e aborta em falha/conflito. Navegador vazio não substitui a cópia existente. Os snapshots de notas não são removidos automaticamente nesta versão.

Enquanto o servidor antigo estiver aberto, as notas podem ser usadas e exportadas localmente; o painel informa que a cópia das notas no PC depende do próximo início do servidor. A atualização não reinicia servidor ou computador. Não há sincronização com outros dispositivos.

Testes em Chrome isolado: oito áreas em 320/390/750/1440px, menu móvel, CRUD de notas, lembrete concluído/filtro, pin, literalidade de texto, exportação JSON, restauração real e falha, preservação de rascunho em erro, origem/esquema rejeitados, preservação de backup em navegador vazio. Regressões de biblioteca, planejamento, cadastros, reconexão, backups e offline passaram. Sem teste em aparelho físico ou leitor de tela.


## 0.6.1 — Correções de legibilidade e confiabilidade

Formulários com rótulos visíveis e espaço responsivo, biblioteca com cartões mais largos e títulos legíveis, versões antigas removidas dos painéis. Calculadora sem teclas duplicadas. Cronômetro bloqueia configuração durante a sessão, confirma reinício e informa falhas de gravação sem declarar sucesso. Removido controle de silêncio sem efeito; não há alertas sonoros ou de sistema. Notas podem importar o JSON exportado, preservando IDs já existentes. Proteção explica HTTP local e separa backup dos cadastros e do caderno.

Testes em Chrome isolado: formulários em 320/390/750/1440/1918px, importação de notas e duplicatas, cronômetro concluído e falha de armazenamento, cancelamento de reinício, calculadora e divisão por zero. Regressões de notas, biblioteca, cadastros, restauração, reconexão e cache offline passaram. Sem teste físico móvel, leitor de tela ou instalação HTTPS. Nenhuma alteração do servidor nesta versão; basta recarregar a interface após salvar rascunhos.
