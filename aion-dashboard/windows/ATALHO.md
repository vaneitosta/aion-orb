# Atalho AION no Windows

O iniciador abre o mesmo aplicativo/perfil do Edge, após verificar ou iniciar o servidor em 127.0.0.1:5500. Python 3 deve estar instalado. Não inicia automaticamente a interface no logon: o usuário abre o ícone AION Dashboard quando quiser.

## Configuração em outra instalação
1. Faça backup do atalho e da pasta _automacao.
2. Copie abrir_aion.py para _automacao, dentro da instalação AION-Dashboard.
3. Copie o atalho original do aplicativo AION do Edge para _automacao/AION-Edge.lnk, sem alterar seus argumentos de perfil. Não substitua esse arquivo por um atalho que já chama o iniciador, para evitar recursão.
4. No atalho da Área de Trabalho, use o pythonw.exe da instalação Python existente como executável, com o caminho absoluto entre aspas de _automacao/abrir_aion.py como argumento. Diretório de trabalho: AION-Dashboard. Preserve o ícone e nome AION Dashboard.

Nenhum .lnk específico de máquina é publicado. Não alterar ou apagar o perfil do navegador, localStorage ou _backups_dados. O AutoUpdate da aplicação não sobrescreve _automacao.

## Teste após reiniciar
1. Antes de reiniciar, salve seu trabalho. No AION, use Salvar dados no PC e confirme sucesso; opcionalmente exporte JSON como cópia adicional.
2. Reinicie normalmente o Windows e entre com o mesmo usuário.
3. Sem abrir terminal ou servidor manualmente, dê duplo clique em AION Dashboard e aguarde até 30 segundos.
4. Confira versão 0.5.4, rótulos completos no Radar e os mesmos cadastros, se existirem.
5. Use Salvar dados no PC e confirme a mensagem de sucesso. Isso verifica a API local, além do conteúdo que pode estar disponível offline.
6. Feche somente a janela do AION e abra pelo mesmo ícone outra vez. O servidor existente deve ser reutilizado.

Se aparecer erro, não reinstale nem limpe dados do navegador. Guarde a mensagem e consulte _automacao_logs/atalho.log e servidor-erros.log. Não execute restauração apenas porque uma janela aparece vazia: confirme primeiro o perfil e endereço.

Validação realizada por terminal em ambiente isolado: servidor inicialmente indisponível, inicialização real, resposta da API, segunda chamada sem novo processo, abertura do atalho Edge registrada por mock. Não foi realizado reinício real do Windows nem desligamento do servidor principal: o comando de desligamento foi bloqueado pela revisão automática. Não se declara esse cenário validado.
