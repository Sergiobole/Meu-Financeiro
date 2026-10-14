💰 Minhas Finanças - Controle Financeiro Pessoal
Uma aplicação web leve, prática e responsiva para controle financeiro diário, projetada para rodar diretamente no navegador sem a necessidade de servidores ou bancos de dados externos. Totalmente compatível com GitHub Pages e adaptada para dispositivos móveis e desktop.
🚀 Funcionalidades
 * Painel de Balanço em Tempo Real: Visualização dinâmica de saldo acumulado, total de receitas e total de despesas.
 * Registro de Transações: Entrada rápida de receitas e despesas com descrição, valor, categoria e data.
 * Gráfico de Gastos por Categoria: Distribuição percentual das saídas através de gráfico estilo doughnut gerado via Chart.js.
 * Histórico com Exclusão Individual: Listagem organizada das movimentações com possibilidade de deletar lançamentos pontuais.
 * Persistência Local (localStorage): Os dados são mantidos diretamente no navegador do usuário, garantindo privacidade e carregamento instantâneo sem necessidade de login.
 * Design Responsivo Mobile-First: Interface limpa construída com Tailwind CSS, utilizável no celular ou no monitor.
🛠️ Tecnologias Utilizadas
 * HTML5: Semântica e estrutura base.
 * JavaScript (ES6+): Regras de cálculo, manipulação de DOM e gerenciamento de armazenamento local.
 * Tailwind CSS (via CDN): Estilização utilitária moderna e responsiva.
 * Chart.js (via CDN): Renderização vetorial e interativa de gráficos.
📋 Como Publicar no GitHub Pages
O projeto consiste em um único arquivo (index.html), o que torna o processo de hospedagem imediato:
 * Crie um novo repositório no seu GitHub.
 * Adicione o arquivo index.html na raiz (/) da branch principal (main).
 * No menu superior do repositório, clique em Settings (Configurações).
 * No menu lateral esquerdo, vá para a seção Pages.
 * Sob o título Build and deployment > Source, selecione Deploy from a branch.
 * Em Branch, selecione main e a pasta /(root).
 * Clique em Save.
 * Aguarde cerca de 1 a 2 minutos. O link de acesso estará disponível no topo da página de configurações (ex: [https://seu-usuario.github.io/nome-do-repositorio/](https://seu-usuario.github.io/nome-do-repositorio/)).
📱 Dica: Usar como App no Celular
Como a aplicação é 100% responsiva, você pode usá-la com visual de aplicativo nativo sem instalar nada pelas lojas:
 * No Android (Google Chrome):
   * Acesse o link publicado do GitHub Pages.
   * Toque no ícone de três pontos no canto superior direito.
   * Selecione Adicionar à tela inicial ou Instalar aplicativo.
 * No iOS (Safari):
   * Acesse o link publicado no Safari.
   * Toque no ícone de Compartilhar (quadrado com seta para cima).
   * Role para baixo e selecione Adicionar à Tela de Início.
📖 Como Usar
 * Adicionar Lançamento:
   * Preencha a descrição (ex: Supermercado).
   * Digite o valor numérico.
   * Selecione se é uma Despesa ou Receita.
   * Escolha a categoria correspondente e a data.
   * Clique em Registrar Lançamento.
 * Consultar o Balanço:
   * Os cartões de saldo e o gráfico de categorias serão recalculados imediatamente.
 * Excluir Registro:
   * No histórico inferior, clique no botão × ao lado da transação desejada.
 * Zerar Dados:
   * Caso queira limpar todo o histórico do navegador, utilize o botão Resetar Dados no topo da página.
