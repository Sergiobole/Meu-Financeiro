/**
 * Módulo de geração e exportação de relatórios em PDF com html2pdf.js
 * Sanitização rigorosa contra injeção de HTML/XSS e layout otimizado para impressão A4.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./utils.js'), require('./calculations.js'), require('./state.js'));
  } else {
    root.Financas = root.Financas || {};
    root.Financas.Reports = factory(root.Financas.Utils, root.Financas.Calculations, root.Financas.State);
  }
})(typeof self !== 'undefined' ? self : this, function (Utils, Calculations, State) {
  'use strict';

  /**
   * Constrói o HTML estruturado para o Extrato Mensal
   */
  function buildMonthlyReportHtml({ mes, ano, transacoesMes, resumo }) {
    const emissaoEm = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const ordenadas = [...transacoesMes].sort((a, b) => a.data.localeCompare(b.data));

    const categoriasHtml = Object.keys(resumo.gastosPorCategoria).length > 0
      ? Object.entries(resumo.gastosPorCategoria).map(([cat, val]) => {
          const perc = resumo.despesas > 0 ? ((val / resumo.despesas) * 100).toFixed(1) : '0';
          return `
            <tr>
              <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 500;">${Utils.escapeHtml(cat)}</td>
              <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${Utils.formatCurrency(val)}</td>
              <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: #64748b;">${perc}%</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="3" style="padding: 10px; text-align: center; color: #94a3b8; border: 1px solid #e2e8f0;">
            Nenhuma despesa registrada neste período.
          </td>
        </tr>
      `;

    const transacoesHtml = ordenadas.length > 0
      ? ordenadas.map(t => {
          const isRec = t.tipo === 'receita';
          const corValor = isRec ? '#047857' : '#b91c1c';
          const sinal = isRec ? '+' : '-';
          const badgeFreq = t.frequencia === 'parcelado' ? 'Parcelado' : (t.frequencia === 'recorrente' ? 'Recorrente' : 'Único');

          return `
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #e2e8f0; white-space: nowrap;">${Utils.formatDateBR(t.data)}</td>
              <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 500;">${Utils.escapeHtml(t.desc)}</td>
              <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 9px;">${badgeFreq}</td>
              <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${Utils.escapeHtml(t.categoria)}</td>
              <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${corValor}; white-space: nowrap;">
                ${sinal} ${Utils.formatCurrency(t.valor)}
              </td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8; border: 1px solid #e2e8f0;">
            Nenhuma movimentação registrada no mês selecionado.
          </td>
        </tr>
      `;

    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; padding: 24px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #4338ca; letter-spacing: -0.5px;">💰 RELATÓRIO FINANCEIRO MENSAL</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">
              Competência: <strong style="color: #1e293b;">${Utils.MESES[mes]} de ${ano}</strong>
            </p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0;">Emissão: ${emissaoEm}</p>
            <p style="margin: 0; font-weight: 600; color: #6366f1;">Status: Consolidado</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase;">Total de Receitas</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: #15803d;">${Utils.formatCurrency(resumo.receitas)}</div>
          </div>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Total de Despesas</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: #b91c1c;">${Utils.formatCurrency(resumo.despesas)}</div>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Saldo Líquido</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: ${resumo.saldo >= 0 ? '#0f172a' : '#b91c1c'};">
              ${Utils.formatCurrency(resumo.saldo)}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            Distribuição por Categoria
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0;">Categoria</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right;">Total Gasto</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right;">% do Total</th>
              </tr>
            </thead>
            <tbody>
              ${categoriasHtml}
            </tbody>
          </table>
        </div>

        <div>
          <h2 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            Extrato Analítico dos Lançamentos (${ordenadas.length})
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 6px 8px; border: 1px solid #e2e8f0; width: 75px;">Data</th>
                <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Descrição</th>
                <th style="padding: 6px 8px; border: 1px solid #e2e8f0; width: 75px; text-align: center;">Modalidade</th>
                <th style="padding: 6px 8px; border: 1px solid #e2e8f0; width: 110px;">Categoria</th>
                <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; width: 95px;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${transacoesHtml}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 26px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8;">
          <span>Minhas Finanças • Controle Pessoal</span>
          <span>Documento gerado automaticamente</span>
        </div>
      </div>
    `;
  }

  /**
   * Constrói o HTML estruturado para o Demonstrativo Anual Consolidado
   */
  function buildAnnualReportHtml({ ano, dadosAnual }) {
    const emissaoEm = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const linhasMeses = dadosAnual.meses.map(m => {
      const semMovimento = m.receitas === 0 && m.despesas === 0;
      const corTexto = semMovimento ? 'color: #94a3b8;' : 'color: #1e293b;';
      const corSaldo = m.saldo >= 0 ? '#15803d' : '#b91c1c';

      return `
        <tr style="${corTexto}">
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: 600;">${m.mesNome}</td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: #15803d;">${Utils.formatCurrency(m.receitas)}</td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; color: #b91c1c;">${Utils.formatCurrency(m.despesas)}</td>
          <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${corSaldo};">
            ${Utils.formatCurrency(m.saldo)}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; padding: 24px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #4338ca; letter-spacing: -0.5px;">📊 DEMONSTRATIVO ANUAL CONSOLIDADO</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">
              Exercício: <strong style="color: #1e293b;">Ano de ${ano}</strong>
            </p>
          </div>
          <div style="text-align: right; font-size: 10px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0;">Emissão: ${emissaoEm}</p>
            <p style="margin: 0; font-weight: 600; color: #6366f1;">Tipo: Comparativo Mensal</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase;">Receitas Acumuladas</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: #15803d;">${Utils.formatCurrency(dadosAnual.totalReceitas)}</div>
          </div>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Despesas Acumuladas</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: #b91c1c;">${Utils.formatCurrency(dadosAnual.totalDespesas)}</div>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
            <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Resultado Líquido Anual</span>
            <div style="font-size: 17px; font-weight: 700; margin-top: 4px; color: ${dadosAnual.saldoAnual >= 0 ? '#0f172a' : '#b91c1c'};">
              ${Utils.formatCurrency(dadosAnual.saldoAnual)}
            </div>
          </div>
        </div>

        <div>
          <h2 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            Evolução Mês a Mês (Janeiro a Dezembro)
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0;">Mês</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right;">Receitas (+)</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right;">Despesas (-)</th>
                <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right;">Resultado Líquido</th>
              </tr>
            </thead>
            <tbody>
              ${linhasMeses}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #0f172a;">TOTAL ACUMULADO</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; color: #15803d;">${Utils.formatCurrency(dadosAnual.totalReceitas)}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; color: #b91c1c;">${Utils.formatCurrency(dadosAnual.totalDespesas)}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${dadosAnual.saldoAnual >= 0 ? '#0f172a' : '#b91c1c'};">
                  ${Utils.formatCurrency(dadosAnual.saldoAnual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 26px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8;">
          <span>Minhas Finanças • Controle Pessoal</span>
          <span>Documento gerado automaticamente</span>
        </div>
      </div>
    `;
  }

  /**
   * Executa a geração do PDF e inicia o download
   */
  function exportPdf({ tipo = 'mensal', mes, ano, onStart, onComplete, onError }) {
    if (typeof onStart === 'function') onStart();

    try {
      const container = document.getElementById('areaImpressaoRelatorio');
      if (!container) throw new Error('Contêiner de impressão não localizado.');

      const todas = State.getAll();
      let html = '';
      let nomeArquivo = '';

      if (tipo === 'mensal') {
        const transMes = Calculations.getTransactionsForMonth(todas, mes, ano);
        const resumo = Calculations.computeMonthlySummary(transMes);
        html = buildMonthlyReportHtml({ mes, ano, transacoesMes: transMes, resumo });
        nomeArquivo = `Extrato_Mensal_${Utils.MESES[mes]}_${ano}.pdf`;
      } else {
        const dadosAnual = Calculations.computeAnnualSummary(todas, ano);
        html = buildAnnualReportHtml({ ano, dadosAnual });
        nomeArquivo = `Demonstrativo_Anual_${ano}.pdf`;
      }

      container.innerHTML = html;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (typeof window.html2pdf !== 'function') {
        throw new Error('Biblioteca html2pdf não carregada.');
      }

      window.html2pdf().set(opt).from(container).save()
        .then(() => {
          container.innerHTML = '';
          if (Utils && Utils.showToast) {
            Utils.showToast(`Relatório ${nomeArquivo} gerado com sucesso!`, 'success');
          }
          if (typeof onComplete === 'function') onComplete();
        })
        .catch(err => {
          container.innerHTML = '';
          console.error('Erro na conversão PDF:', err);
          if (Utils && Utils.showToast) {
            Utils.showToast('Erro ao converter o relatório para PDF.', 'error');
          }
          if (typeof onError === 'function') onError(err);
        });
    } catch (err) {
      console.error('Erro ao preparar relatório:', err);
      if (Utils && Utils.showToast) {
        Utils.showToast('Erro ao preparar o relatório.', 'error');
      }
      if (typeof onError === 'function') onError(err);
    }
  }

  return {
    exportPdf
  };
});
