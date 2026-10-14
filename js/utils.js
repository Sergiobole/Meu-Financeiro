/**
 * Utilitários gerais do aplicativo Minhas Finanças
 * - Sanitização anti-XSS
 * - Formatação monetária e de datas
 * - Regras matemáticas seguras (datas no fim do mês e rateio de centavos)
 * - Sistema de feedback visual (Toasts e Modais personalizados)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Financas = root.Financas || {};
    root.Financas.Utils = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  /**
   * Sanitiza strings contra injeção de HTML / XSS
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Formata número para Moeda Brasileira (BRL)
   */
  function formatCurrency(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Converte data 'AAAA-MM-DD' em 'DD/MM/AAAA'
   */
  function formatDateBR(dataIso) {
    if (!dataIso || typeof dataIso !== 'string') return '';
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /**
   * Retorna a quantidade de dias existente em um determinado mês/ano
   * mês: 0 = Janeiro, 11 = Dezembro
   */
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Adiciona meses a uma data preservando o dia de origem sempre que possível,
   * sem provocar transbordamento (ex: 31 de Janeiro + 1 mês = 28/29 de Fevereiro, nunca Março).
   */
  function addMonthsPreservingDay(origYear, origMonth, origDay, monthOffset) {
    let targetYear = origYear;
    let targetMonth = origMonth + monthOffset;

    // Normaliza virada de anos
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = ((targetMonth % 12) + 12) % 12;

    const maxDays = getDaysInMonth(targetYear, targetMonth);
    const finalDay = Math.min(origDay, maxDays);

    const yyyy = String(targetYear);
    const mm = String(targetMonth + 1).padStart(2, '0');
    const dd = String(finalDay).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Rateia o valor total entre N parcelas distribuindo os centavos residuais
   * de forma que a soma das parcelas seja rigorosamente igual ao valor total.
   * Ex: R$ 100 em 3 parcelas -> [33.34, 33.33, 33.33] => Soma: 100.00
   */
  function calculateInstallmentValues(totalValue, numInstallments) {
    const totalCents = Math.round(Number(totalValue) * 100);
    const baseCents = Math.floor(totalCents / numInstallments);
    let remainderCents = totalCents - (baseCents * numInstallments);

    const parcelas = [];
    for (let i = 0; i < numInstallments; i++) {
      let cents = baseCents;
      if (remainderCents > 0) {
        cents += 1;
        remainderCents--;
      }
      parcelas.push(cents / 100);
    }
    return parcelas;
  }

  /**
   * Notificação Toast flutuante, não-bloqueante e elegante
   */
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-3 opacity-0 flex items-center gap-3 p-3.5 rounded-xl shadow-xl text-sm font-medium border backdrop-blur-md`;

    let icon = 'ℹ️';
    let colorClasses = 'bg-slate-900/90 text-white border-slate-700';

    if (type === 'success') {
      icon = '✅';
      colorClasses = 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60 shadow-emerald-900/20';
    } else if (type === 'error') {
      icon = '❌';
      colorClasses = 'bg-rose-950/90 text-rose-100 border-rose-700/60 shadow-rose-900/20';
    } else if (type === 'warning') {
      icon = '⚠️';
      colorClasses = 'bg-amber-950/90 text-amber-100 border-amber-700/60 shadow-amber-900/20';
    }

    toast.className += ` ${colorClasses}`;
    toast.innerHTML = `
      <span class="text-base flex-shrink-0">${icon}</span>
      <span class="flex-1 text-xs sm:text-sm leading-snug">${escapeHtml(message)}</span>
      <button class="text-xs opacity-60 hover:opacity-100 transition ml-2 font-bold px-1">&times;</button>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-3');
    });

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  /**
   * Modal genérico moderno para substituição de confirms nativos
   */
  function showConfirmModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false, onConfirm, onCancel }) {
    const modalId = 'customConfirmModal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scaleIn">
        <h3 class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(title)}</h3>
        <p class="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">${escapeHtml(message)}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button id="btnModalCancel" class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
            ${escapeHtml(cancelText)}
          </button>
          <button id="btnModalConfirm" class="px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-sm ${
            isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }">
            ${escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      modal.classList.add('opacity-0');
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#btnModalCancel').addEventListener('click', () => {
      cleanup();
      if (typeof onCancel === 'function') onCancel();
    });

    modal.querySelector('#btnModalConfirm').addEventListener('click', () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  /**
   * Modal especializado para exclusão de parcelas / lançamentos em grupo
   */
  function showGroupDeleteModal({ onAll, onSingle, onCancel }) {
    const modalId = 'groupDeleteModal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scaleIn">
        <div class="flex items-center gap-3">
          <span class="text-2xl p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">🗓️</span>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Lançamento em Grupo</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Esta transação faz parte de um parcelamento ou recorrência.</p>
          </div>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Como deseja prosseguir com a exclusão?
        </p>
        <div class="space-y-2 pt-1">
          <button id="btnDeleteAll" class="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold transition text-left">
            <span>🗑️ Excluir TODAS as parcelas do grupo</span>
            <span class="text-[10px] bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full">Completo</span>
          </button>
          <button id="btnDeleteSingle" class="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition text-left">
            <span>✂️ Excluir APENAS esta parcela selecionada</span>
            <span class="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Individual</span>
          </button>
        </div>
        <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button id="btnCancelGroup" class="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition">
            Cancelar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cleanup = () => {
      modal.classList.add('opacity-0');
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#btnDeleteAll').addEventListener('click', () => {
      cleanup();
      if (typeof onAll === 'function') onAll();
    });

    modal.querySelector('#btnDeleteSingle').addEventListener('click', () => {
      cleanup();
      if (typeof onSingle === 'function') onSingle();
    });

    modal.querySelector('#btnCancelGroup').addEventListener('click', () => {
      cleanup();
      if (typeof onCancel === 'function') onCancel();
    });
  }

  return {
    MESES,
    escapeHtml,
    formatCurrency,
    formatDateBR,
    getDaysInMonth,
    addMonthsPreservingDay,
    calculateInstallmentValues,
    showToast,
    showConfirmModal,
    showGroupDeleteModal
  };
});
