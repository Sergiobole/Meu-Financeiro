# 💰 Minhas Finanças - Controle Financeiro Pessoal (PWA)

Uma aplicação web moderna, modular, segura e responsiva para controle financeiro diário. Desenvolvida para rodar diretamente no navegador com persistência em `localStorage`, suporte completo a funcionamento **Offline (PWA)**, **Modo Escuro (Dark Mode)** e geração de **Relatórios em PDF**.

---

## 🚀 Funcionalidades Principais

* **Painel de Balanço em Tempo Real:** Visualização dinâmica de saldo líquido, total de receitas e total de despesas com indicador de status (Superávit, Déficit ou Equilibrado).
* **Modalidades Inteligentes de Lançamento:**
  * **Único:** Despesas ou receitas pontuais.
  * **Parcelado:** Rateio automático do valor total com distribuição exata de centavos residuais.
  * **Recorrente:** Lançamentos fixos mensais projetados com virada segura de meses (sem bugs no dia 31).
* **Gráfico de Gastos por Categoria (Chart.js):** Distribuição percentual de despesas através de gráfico estilo doughnut integrado, adaptado dinamicamente para os temas Claro e Escuro.
* **Extrato Interativo:**
  * Pesquisa textual dinâmica em tempo real (descrição e categoria).
  * Filtros por fluxo (Receitas/Despesas) e modalidade (Único/Parcelado/Recorrente).
  * Ordenação por data e valor.
* **Exclusão Inteligente em Lote:** Ao remover uma transação parcelada ou recorrente, escolha entre apagar apenas aquela parcela ou todo o grupo vinculado.
* **Relatórios em PDF Profissionais (html2pdf.js):**
  * **Extrato Mensal Detalhado:** Totais, percentuais de categorias e tabela analítica.
  * **Demonstrativo Anual Consolidado:** Matriz comparativa dos 12 meses do ano selecionado.
* **Backup e Restauração Segura:** Exportação em JSON e importação com suporte a substituição total ou mesclagem sem duplicação de lançamentos.
* **PWA & Offline:** Service Worker registrado para funcionamento offline e instalação nativa no celular ou desktop.
* **Modo Escuro / Claro (Dark Mode):** Alternância instantânea com persistência da preferência no navegador.

---

## 🛡️ Correções Técnicas e Melhorias Aplicadas

1. **Proteção Anti-XSS:** Todas as inserções no DOM e nos relatórios em PDF passam por escape rigoroso de entidades HTML (`Utils.escapeHtml`), prevenindo injeções de scripts.
2. **Cálculo de Fim de Mês Seguro:** Datas no dia 29, 30 ou 31 respeitam o último dia de cada mês sem pular para o mês seguinte (ex: 31/01 + 1 mês = 28/02).
3. **Distribuição Exata de Centavos:** Rateio de compras parceladas ajusta os centavos residuais na primeira parcela, garantindo que a soma seja rigorosamente igual ao valor original.
4. **Filtro Dinâmico de Anos:** O seletor de anos analisa todas as transações cadastradas, assegurando que históricos antigos ou futuros sempre estejam visíveis.
5. **Arquitetura Modular:** Separação limpa de responsabilidades em módulos UMD/IIFE compatíveis tanto via servidor web (Apache/XAMPP/GitHub Pages) quanto via `file:///`.

---

## 📂 Estrutura do Projeto

```
Meu-Financeiro/
├── index.html              # Estrutura HTML limpa e semântica
├── manifest.webmanifest    # Manifesto de configuração PWA
├── sw.js                   # Service Worker para cache e uso offline
├── README.md               # Documentação completa
├── css/
│   └── style.css           # Estilos customizados, scrollbars e temas
├── js/
│   ├── utils.js            # Sanitização XSS, formatações, toasts e modais
│   ├── state.js            # Gerenciamento de estado, localStorage e backups
│   ├── calculations.js     # Regras matemáticas, parcelamentos e filtros
│   ├── charts.js           # Renderização e temas do Chart.js
│   ├── reports.js          # Geração e exportação de PDFs
│   ├── ui.js               # Manipulação do DOM e eventos de interface
│   └── app.js              # Ponto de entrada e bootstrap do aplicativo
└── icons/
    └── icon.svg            # Ícone vetorial de alta definição para o PWA
```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5** & **Vanilla JavaScript (ES6+)**: Módulos desacoplados e sem dependência de frameworks pesados.
* **Tailwind CSS**: Estilização utilitária responsiva com suporte nativo a `dark:`.
* **Chart.js**: Renderização gráfica vetorial interativa.
* **html2pdf.js**: Motor de conversão do DOM para documentos PDF A4.
* **Web APIs**: `localStorage`, `ServiceWorker`, `FileReader`, `matchMedia`.

---

## 📱 Como Usar como App (PWA) no Celular ou Desktop

* **No Computador (Chrome/Edge):**
  * Clique no botão **📲 Instalar App** que surge na barra superior ou no ícone de instalação na barra de endereços.
* **No Android (Chrome):**
  * Toque nos três pontos do navegador e selecione **Adicionar à tela inicial** ou **Instalar aplicativo**.
* **No iOS (Safari):**
  * Toque em **Compartilhar** (ícone do quadrado com a seta) e escolha **Adicionar à Tela de Início**.

---

## 📋 Como Publicar no GitHub Pages

1. Envie os arquivos do projeto para o seu repositório no GitHub na branch principal (`main`).
2. Acesse **Settings > Pages** no repositório.
3. Em **Build and deployment > Source**, selecione **Deploy from a branch**.
4. Defina a branch como `main` e a pasta como `/ (root)`.
5. Clique em **Save**. O aplicativo estará disponível online em 1 a 2 minutos com suporte PWA HTTPS automático.
