/**
 * Gerenciador da Interface do Usuário (DOM, Eventos, Modais e Renderização Reativa)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./utils.js'),
      require('./state.js'),
      require('./calculations.js'),
      require('./charts.js'),
      require('./reports.js')
    );
  } else {
    root.Financas = root.Financas || {};
    root.Financas.UI = factory(
      root.Financas.Utils,
      root.Financas.State,
      root.Financas.Calculations,
      root.Financas.Charts,
      root.Financas.Reports
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Utils, State, Calculations, Charts, Reports) {
  'use strict';

  // Ícones representativos para as categorias
  const CATEGORIA_ICONES = {
    'Moradia': '🏠',
    'Contas & Serviços': '⚡',
    'Alimentação': '🍔',
    'Assinaturas': '🎬',
    'Transporte': '🚗',
    'Lazer': '🏖️',
    'Saúde': '🩺',
    'Compras': '🛍️',
    'Salário': '💼',
    'Outros': '📌'
  };

  function getCategoriaIcone(categoria) {
    return CATEGORIA_ICONES[categoria] || '📌';
  }

  /**
   * Atualiza a lista de opções do filtro de Anos garantindo que nenhum ano seja omitido
   */
  function updateYearOptions() {
    const selectAno = document.getElementById('filtroAno');
    if (!selectAno) return;

    const anoSelecionado = parseInt(selectAno.value, 10) || new Date().getFullYear();
    const anosDisponiveis = Calculations.getAvailableYears(State.getAll());

    selectAno.innerHTML = '';
    anosDisponiveis.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a;
      opt.innerText = a;
      if (a === anoSelecionado) opt.selected = true;
      selectAno.appendChild(opt);
    });

    // Se o ano atual não estava selecionado e não foi mantido, seleciona o último ou ano corrente
    if (!anosDisponiveis.includes(anoSelecionado)) {
      const hojeAno = new Date().getFullYear();
      selectAno.value = anosDisponiveis.includes(hojeAno) ? hojeAno : anosDisponiveis[anosDisponiveis.length - 1];
    }
  }

  /**
   * Alterna a visibilidade dos campos específicos para parcelamento ou recorrência
   */
  function adjustFrequencyFields() {
    const freqEl = document.getElementById('frequencia');
    const campoParcelas = document.getElementById('campoParcelas');
    const campoRecorrencia = document.getElementById('campoRecorrencia');
    const labelValor = document.getElementById('labelValor');

    if (!freqEl || !campoParcelas || !campoRecorrencia || !labelValor) return;

    const freq = freqEl.value;
    campoParcelas.classList.add('hidden');
    campoRecorrencia.classList.add('hidden');

    if (freq === 'parcelado') {
      campoParcelas.classList.remove('hidden');
      labelValor.innerText = 'Valor Total da Compra (R$)';
    } else if (freq === 'recorrente') {
      campoRecorrencia.classList.remove('hidden');
      labelValor.innerText = 'Valor Mensal (R$)';
    } else {
      labelValor.innerText = 'Valor (R$)';
    }
  }

  /**
   * Renderiza a interface completa de acordo com o estado e os filtros ativos
   */
  function render() {
    const filtroMes = document.getElementById('filtroMes');
    const filtroAno = document.getElementById('filtroAno');
    if (!filtroMes || !filtroAno) return;

    const mes = parseInt(filtroMes.value, 10);
    const ano = parseInt(filtroAno.value, 10);

    const todas = State.getAll();
    const transacoesMes = Calculations.getTransactionsForMonth(todas, mes, ano);
    const resumo = Calculations.computeMonthlySummary(transacoesMes);

    // Atualização dos Cards de Balanço
    const saldoEl = document.getElementById('saldoTotal');
    const recEl = document.getElementById('totalReceitas');
    const despEl = document.getElementById('totalDespesas');
    const statusPill = document.getElementById('statusIndicador');

    if (recEl) recEl.innerText = Utils.formatCurrency(resumo.receitas);
    if (despEl) despEl.innerText = Utils.formatCurrency(resumo.despesas);

    if (saldoEl) {
      saldoEl.innerText = Utils.formatCurrency(resumo.saldo);
      if (resumo.saldo < 0) {
        saldoEl.className = 'text-2xl sm:text-3xl font-bold mt-1 text-rose-600 dark:text-rose-400';
      } else {
        saldoEl.className = 'text-2xl sm:text-3xl font-bold mt-1 text-slate-900 dark:text-white';
      }
    }

    if (statusPill) {
      statusPill.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${resumo.status.badgeClass}`;
      statusPill.innerHTML = `<span>${resumo.status.icon}</span> <span>${resumo.status.label}</span>`;
    }

    // Gráfico de Despesas do Mês
    Charts.renderExpenseChart('graficoCategorias', resumo.gastosPorCategoria, resumo.despesas);

    // Filtros e ordenação da tabela
    const filtroFluxo = document.getElementById('filtroTipoFluxo')?.value || 'todos';
    const filtroModalidade = document.getElementById('filtroModalidade')?.value || 'todos';
    const filtroOrdenacao = document.getElementById('filtroOrdenacao')?.value || 'data_desc';
    const termoBusca = document.getElementById('campoBuscaTexto')?.value || '';

    const listaFiltrada = Calculations.filterAndSort(transacoesMes, {
      fluxo: filtroFluxo,
      modalidade: filtroModalidade,
      termoBusca,
      ordenacao: filtroOrdenacao
    });

    // Contador de lançamentos
    const contador = document.getElementById('contadorItens');
    if (contador) {
      contador.innerText = `${listaFiltrada.length} de ${transacoesMes.length} lançamentos`;
    }

    // Tabela de lançamentos com proteção anti-XSS rigorosa
    const tabela = document.getElementById('tabelaTransacoes');
    if (tabela) {
      tabela.innerHTML = '';

      if (listaFiltrada.length === 0) {
        tabela.innerHTML = `
          <tr>
            <td colspan="6" class="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="text-3xl opacity-60">🍃</span>
                <p class="font-medium">Nenhum lançamento encontrado para este período ou busca.</p>
              </div>
            </td>
          </tr>
        `;
      } else {
        listaFiltrada.forEach(t => {
          let badgeModalidade = '';
          if (t.frequencia === 'parcelado') {
            badgeModalidade = '<span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">Parcelado</span>';
          } else if (t.frequencia === 'recorrente') {
            badgeModalidade = '<span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/40">Recorrente</span>';
          } else {
            badgeModalidade = '<span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Único</span>';
          }

          const isReceita = t.tipo === 'receita';
          const corValor = isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
          const iconeCat = getCategoriaIcone(t.categoria);

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200';
          tr.innerHTML = `
            <td class="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">${Utils.formatDateBR(t.data)}</td>
            <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[220px] truncate" title="${Utils.escapeHtml(t.desc)}">
              ${Utils.escapeHtml(t.desc)}
            </td>
            <td class="py-3 px-3 whitespace-nowrap">${badgeModalidade}</td>
            <td class="py-3 px-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>${iconeCat}</span>
                <span>${Utils.escapeHtml(t.categoria)}</span>
              </span>
            </td>
            <td class="py-3 px-3 text-right font-bold whitespace-nowrap ${corValor}">
              ${isReceita ? '+' : '-'} ${Utils.formatCurrency(t.valor)}
            </td>
            <td class="py-3 px-3 text-center">
              <button data-id="${t.id}" data-group="${t.groupId || ''}" title="Excluir lançamento" class="btn-excluir text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                &times;
              </button>
            </td>
          `;

          const btnExcluir = tr.querySelector('.btn-excluir');
          btnExcluir.addEventListener('click', () => {
            handleDelete(t.id, t.groupId);
          });

          tabela.appendChild(tr);
        });
      }
    }
  }

  /**
   * Gerencia a exclusão de lançamentos (com inteligência para grupos de parcelas)
   */
  function handleDelete(id, groupId) {
    if (groupId) {
      Utils.showGroupDeleteModal({
        onAll: () => {
          State.removeGroup(groupId);
          Utils.showToast('Todas as parcelas do grupo foram excluídas.', 'success');
        },
        onSingle: () => {
          State.remove(id);
          Utils.showToast('Lançamento individual excluído.', 'info');
        }
      });
    } else {
      State.remove(id);
      Utils.showToast('Lançamento excluído com sucesso.', 'info');
    }
  }

  /**
   * Manipulador do envio do formulário de nova transação
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    const descInput = document.getElementById('desc');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipo');
    const freqInput = document.getElementById('frequencia');
    const catInput = document.getElementById('categoria');
    const dataInput = document.getElementById('data');

    const desc = descInput.value.trim();
    const valor = parseFloat(valorInput.value);
    const tipo = tipoInput.value;
    const frequencia = freqInput.value;
    const categoria = catInput.value;
    const data = dataInput.value;

    if (!desc || isNaN(valor) || valor <= 0 || !data) {
      Utils.showToast('Por favor, preencha todos os campos obrigatórios corretamente.', 'warning');
      return;
    }

    if (frequencia === 'unico') {
      State.add({
        id: Date.now(),
        desc,
        valor,
        tipo,
        frequencia,
        categoria,
        data
      });
      Utils.showToast('Lançamento registrado com sucesso!', 'success');
    } else if (frequencia === 'parcelado') {
      const parcelas = parseInt(document.getElementById('numParcelas').value, 10) || 2;
      const transacoesParceladas = Calculations.generateInstallmentTransactions({
        desc,
        valorTotal: valor,
        tipo,
        categoria,
        dataInicio: data,
        parcelas
      });
      State.add(transacoesParceladas);
      Utils.showToast(`Compra parcelada em ${parcelas}x registrada com sucesso!`, 'success');
    } else if (frequencia === 'recorrente') {
      const meses = parseInt(document.getElementById('mesesRecorrencia').value, 10) || 12;
      const transacoesRecorrentes = Calculations.generateRecurringTransactions({
        desc,
        valorMensal: valor,
        tipo,
        categoria,
        dataInicio: data,
        meses
      });
      State.add(transacoesRecorrentes);
      Utils.showToast(`Lançamento fixo recorrente projetado por ${meses} meses!`, 'success');
    }

    // Reseta formulário e redefine a data para hoje
    e.target.reset();
    dataInput.valueAsDate = new Date();
    adjustFrequencyFields();
    updateYearOptions();
  }

  /**
   * Limpa a busca textual
   */
  function clearSearchText() {
    const input = document.getElementById('campoBuscaTexto');
    if (input) {
      input.value = '';
      render();
    }
  }

  /**
   * Reseta todos os dados com confirmação segura
   */
  function handleResetAll() {
    Utils.showConfirmModal({
      title: 'Zerar Todos os Dados?',
      message: 'Esta ação apagará permanentemente todos os lançamentos salvos no seu navegador.\n\nRecomendamos exportar um backup antes de prosseguir.',
      confirmText: 'Sim, Zerar Tudo',
      cancelText: 'Cancelar',
      isDanger: true,
      onConfirm: () => {
        State.clearAll();
        updateYearOptions();
        Utils.showToast('Todos os registros foram apagados.', 'info');
      }
    });
  }

  /**
   * Importação de arquivo JSON de backup com modal customizado
   */
  function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      Utils.showConfirmModal({
        title: 'Restaurar Dados do Backup',
        message: 'Deseja SUBSTITUIR os lançamentos atuais pelos do arquivo, ou MESCLAR sem apagar os existentes?',
        confirmText: 'Substituir',
        cancelText: 'Mesclar',
        onConfirm: () => {
          const res = State.importBackup(content, 'replace');
          if (res.success) {
            updateYearOptions();
            Utils.showToast(`Sucesso! ${res.count} lançamentos restaurados.`, 'success');
          } else {
            Utils.showToast(res.error || 'Erro ao importar.', 'error');
          }
        },
        onCancel: () => {
          const res = State.importBackup(content, 'merge');
          if (res.success) {
            updateYearOptions();
            Utils.showToast('Dados mesclados com sucesso!', 'success');
          } else {
            Utils.showToast(res.error || 'Erro ao mesclar.', 'error');
          }
        }
      });
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /**
   * Controle do Modal de Relatórios
   */
  function openReportModal() {
    const modal = document.getElementById('modalRelatorio');
    if (modal) modal.classList.remove('hidden');
  }

  function closeReportModal() {
    const modal = document.getElementById('modalRelatorio');
    if (modal) modal.classList.add('hidden');
  }

  function handleGeneratePdf() {
    const formato = document.querySelector('input[name="tipoRelatorio"]:checked')?.value || 'mensal';
    const mes = parseInt(document.getElementById('filtroMes').value, 10);
    const ano = parseInt(document.getElementById('filtroAno').value, 10);

    closeReportModal();

    Reports.exportPdf({
      tipo: formato,
      mes,
      ano
    });
  }

  /**
   * Atualização do botão de Tema (Dark / Light)
   */
  function updateThemeButton() {
    const btn = document.getElementById('btnToggleTheme');
    if (!btn) return;
    const isDark = State.getTheme() === 'dark';
    btn.innerHTML = isDark ? '☀️' : '🌙';
    btn.setAttribute('title', isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro');
  }

  function toggleTheme() {
    State.toggleTheme();
    updateThemeButton();
    Charts.refreshTheme();
  }

  return {
    updateYearOptions,
    adjustFrequencyFields,
    render,
    handleDelete,
    handleFormSubmit,
    clearSearchText,
    handleResetAll,
    handleImportFile,
    openReportModal,
    closeReportModal,
    handleGeneratePdf,
    updateThemeButton,
    toggleTheme
  };
});
