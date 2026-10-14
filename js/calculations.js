/**
 * Motor de cálculos financeiros, agrupamentos, filtros e projeções.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./utils.js'));
  } else {
    root.Financas = root.Financas || {};
    root.Financas.Calculations = factory(root.Financas.Utils);
  }
})(typeof self !== 'undefined' ? self : this, function (Utils) {
  'use strict';

  /**
   * Constrói a lista de anos disponíveis com base nas transações existentes e na data atual.
   * Garante que transações antigas ou futuras nunca fiquem invisíveis no filtro.
   */
  function getAvailableYears(transacoes, anoReferencia = new Date().getFullYear()) {
    const anosSet = new Set();

    // Faixa padrão mínima de ±2 a +3 anos
    for (let a = anoReferencia - 2; a <= anoReferencia + 3; a++) {
      anosSet.add(a);
    }

    // Adiciona todos os anos encontrados nos lançamentos
    if (Array.isArray(transacoes)) {
      transacoes.forEach(t => {
        if (t && t.data) {
          const ano = parseInt(t.data.split('-')[0], 10);
          if (!isNaN(ano)) anosSet.add(ano);
        }
      });
    }

    return Array.from(anosSet).sort((a, b) => a - b);
  }

  /**
   * Cria os lançamentos para uma compra parcelada distribuindo os centavos perfeitamente
   * e preservando a virada dos dias no final de cada mês.
   */
  function generateInstallmentTransactions({ desc, valorTotal, tipo, categoria, dataInicio, parcelas }) {
    const groupId = Date.now();
    const partes = dataInicio.split('-');
    const anoOrig = parseInt(partes[0], 10);
    const mesOrig = parseInt(partes[1], 10) - 1;
    const diaOrig = parseInt(partes[2], 10);

    const numParcelas = Math.max(2, parseInt(parcelas, 10) || 2);
    const valoresParcelas = Utils.calculateInstallmentValues(valorTotal, numParcelas);

    const resultado = [];
    for (let i = 0; i < numParcelas; i++) {
      const dataParcela = Utils.addMonthsPreservingDay(anoOrig, mesOrig, diaOrig, i);
      resultado.push({
        id: groupId + i,
        groupId,
        desc: `${desc} (${i + 1}/${numParcelas})`,
        valor: valoresParcelas[i],
        tipo,
        frequencia: 'parcelado',
        categoria,
        data: dataParcela
      });
    }
    return resultado;
  }

  /**
   * Cria os lançamentos para um gasto ou receita recorrente (fixo/assinatura)
   * preservando as viradas corretas de mês.
   */
  function generateRecurringTransactions({ desc, valorMensal, tipo, categoria, dataInicio, meses }) {
    const groupId = Date.now();
    const partes = dataInicio.split('-');
    const anoOrig = parseInt(partes[0], 10);
    const mesOrig = parseInt(partes[1], 10) - 1;
    const diaOrig = parseInt(partes[2], 10);

    const totalMeses = Math.max(1, parseInt(meses, 10) || 12);
    const valor = parseFloat(Number(valorMensal).toFixed(2));

    const resultado = [];
    for (let i = 0; i < totalMeses; i++) {
      const dataRecorrente = Utils.addMonthsPreservingDay(anoOrig, mesOrig, diaOrig, i);
      resultado.push({
        id: groupId + i,
        groupId,
        desc,
        valor,
        tipo,
        frequencia: 'recorrente',
        categoria,
        data: dataRecorrente
      });
    }
    return resultado;
  }

  /**
   * Filtra as transações de um determinado mês e ano
   */
  function getTransactionsForMonth(transacoes, mes, ano) {
    if (!Array.isArray(transacoes)) return [];
    return transacoes.filter(t => {
      if (!t || !t.data) return false;
      const partes = t.data.split('-');
      const tAno = parseInt(partes[0], 10);
      const tMes = parseInt(partes[1], 10) - 1;
      return tMes === mes && tAno === ano;
    });
  }

  /**
   * Calcula o resumo financeiro do mês (receitas, despesas, saldo, participação por categoria)
   */
  function computeMonthlySummary(transacoesMes) {
    let receitas = 0;
    let despesas = 0;
    const gastosPorCategoria = {};

    transacoesMes.forEach(t => {
      const val = Number(t.valor) || 0;
      if (t.tipo === 'receita') {
        receitas += val;
      } else {
        despesas += val;
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + val;
      }
    });

    receitas = parseFloat(receitas.toFixed(2));
    despesas = parseFloat(despesas.toFixed(2));
    const saldo = parseFloat((receitas - despesas).toFixed(2));

    const percentualPorCategoria = {};
    if (despesas > 0) {
      Object.keys(gastosPorCategoria).forEach(cat => {
        const val = gastosPorCategoria[cat];
        percentualPorCategoria[cat] = parseFloat(((val / despesas) * 100).toFixed(1));
      });
    }

    let status = {
      label: 'Superávit',
      colorClass: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
      icon: '📈'
    };

    if (saldo < 0) {
      status = {
        label: 'Déficit',
        colorClass: 'rose',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400',
        icon: '📉'
      };
    } else if (saldo === 0 && receitas === 0 && despesas === 0) {
      status = {
        label: 'Neutro',
        colorClass: 'slate',
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        icon: '⚖️'
      };
    }

    return {
      receitas,
      despesas,
      saldo,
      gastosPorCategoria,
      percentualPorCategoria,
      totalLancamentos: transacoesMes.length,
      status
    };
  }

  /**
   * Filtra e ordena a lista de lançamentos do extrato
   */
  function filterAndSort(transacoesMes, { fluxo = 'todos', modalidade = 'todos', termoBusca = '', ordenacao = 'data_desc' } = {}) {
    const termo = (termoBusca || '').trim().toLowerCase();

    const filtrados = transacoesMes.filter(t => {
      const matchFluxo = (fluxo === 'todos') || (t.tipo === fluxo);
      const matchMod = (modalidade === 'todos') || (t.frequencia === modalidade);

      const desc = (t.desc || '').toLowerCase();
      const cat = (t.categoria || '').toLowerCase();
      const matchTexto = termo === '' || desc.includes(termo) || cat.includes(termo);

      return matchFluxo && matchMod && matchTexto;
    });

    filtrados.sort((a, b) => {
      if (ordenacao === 'data_desc') {
        return b.data.localeCompare(a.data) || b.id - a.id;
      }
      if (ordenacao === 'data_asc') {
        return a.data.localeCompare(b.data) || a.id - b.id;
      }
      if (ordenacao === 'valor_asc') {
        return a.valor - b.valor;
      }
      if (ordenacao === 'valor_desc') {
        return b.valor - a.valor;
      }
      return 0;
    });

    return filtrados;
  }

  /**
   * Computa o resumo consolidado anual mês a mês (Janeiro a Dezembro)
   */
  function computeAnnualSummary(transacoes, ano) {
    const mesesDados = [];
    let anoRec = 0;
    let anoDesp = 0;

    for (let m = 0; m < 12; m++) {
      const transMes = getTransactionsForMonth(transacoes, m, ano);
      let rec = 0;
      let desp = 0;

      transMes.forEach(t => {
        const v = Number(t.valor) || 0;
        if (t.tipo === 'receita') rec += v;
        else desp += v;
      });

      rec = parseFloat(rec.toFixed(2));
      desp = parseFloat(desp.toFixed(2));
      const saldo = parseFloat((rec - desp).toFixed(2));

      anoRec += rec;
      anoDesp += desp;

      mesesDados.push({
        mesIndex: m,
        mesNome: Utils.MESES[m],
        receitas: rec,
        despesas: desp,
        saldo
      });
    }

    anoRec = parseFloat(anoRec.toFixed(2));
    anoDesp = parseFloat(anoDesp.toFixed(2));
    const saldoAnual = parseFloat((anoRec - anoDesp).toFixed(2));

    return {
      ano,
      meses: mesesDados,
      totalReceitas: anoRec,
      totalDespesas: anoDesp,
      saldoAnual
    };
  }

  return {
    getAvailableYears,
    generateInstallmentTransactions,
    generateRecurringTransactions,
    getTransactionsForMonth,
    computeMonthlySummary,
    filterAndSort,
    computeAnnualSummary
  };
});
