/**
 * Gerenciamento e renderização de gráficos com Chart.js
 * Adaptável automaticamente aos modos Claro e Escuro (Dark Mode).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./utils.js'), require('./state.js'));
  } else {
    root.Financas = root.Financas || {};
    root.Financas.Charts = factory(root.Financas.Utils, root.Financas.State);
  }
})(typeof self !== 'undefined' ? self : this, function (Utils, State) {
  'use strict';

  let chartInstance = null;

  // Paleta de cores moderna, harmoniosa e acessível para categorias
  const PALETA_CORES = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16'  // Lime
  ];

  /**
   * Obtém as configurações de cores baseadas no tema ativo
   */
  function getThemeColors() {
    const isDark = State && State.getTheme && State.getTheme() === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      emptyRingColor: isDark ? '#334155' : '#e2e8f0',
      tooltipBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      borderColor: isDark ? '#0f172a' : '#ffffff'
    };
  }

  /**
   * Renderiza ou atualiza o gráfico de despesas por categoria
   */
  function renderExpenseChart(canvasId, gastosPorCategoria, totalDespesas) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();

    const labels = Object.keys(gastosPorCategoria);
    const dataValues = Object.values(gastosPorCategoria);

    // Destrói gráfico anterior para evitar sobreposição e leaks
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    // Caso não haja despesas no mês
    if (labels.length === 0 || totalDespesas <= 0) {
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Sem despesas neste mês'],
          datasets: [{
            data: [1],
            backgroundColor: [theme.emptyRingColor],
            borderWidth: 0,
            hoverOffset: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            tooltip: { enabled: false },
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: theme.textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true
              }
            }
          }
        }
      });
      return;
    }

    const cores = labels.map((_, idx) => PALETA_CORES[idx % PALETA_CORES.length]);

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: cores,
          borderColor: theme.borderColor,
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 650
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' },
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.emptyRingColor,
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const perc = totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(1) : 0;
                return ` ${Utils.formatCurrency(val)} (${perc}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Força a atualização do gráfico existente respeitando nova cor de tema
   */
  function refreshTheme() {
    if (chartInstance) {
      const theme = getThemeColors();
      if (chartInstance.options.plugins && chartInstance.options.plugins.legend) {
        chartInstance.options.plugins.legend.labels.color = theme.textColor;
      }
      chartInstance.update();
    }
  }

  return {
    renderExpenseChart,
    refreshTheme
  };
});
