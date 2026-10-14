/**
 * Gerenciamento centralizado de estado e persistência (localStorage)
 * Suporta histórico de transações, tema visual (Light/Dark) e Backup/Restauração.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./utils.js'));
  } else {
    root.Financas = root.Financas || {};
    root.Financas.State = factory(root.Financas.Utils);
  }
})(typeof self !== 'undefined' ? self : this, function (Utils) {
  'use strict';

  const STORAGE_KEY = 'financas_app_dados';
  const THEME_KEY = 'financas_theme';

  let transacoes = [];
  const listeners = [];

  /**
   * Notifica todos os ouvintes inscritos sobre alterações de estado
   */
  function notify() {
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i](transacoes);
      } catch (err) {
        console.error('Erro ao notificar listener de estado:', err);
      }
    }
  }

  /**
   * Inscreve um callback para ser disparado sempre que os dados mudarem
   */
  function subscribe(listener) {
    if (typeof listener === 'function') {
      listeners.push(listener);
    }
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  /**
   * Sanitiza e valida um registro individual de transação
   */
  function validateAndNormalize(t) {
    if (!t || typeof t !== 'object') return null;
    const valor = parseFloat(t.valor);
    if (isNaN(valor) || valor <= 0) return null;

    return {
      id: Number(t.id) || Date.now() + Math.floor(Math.random() * 1000),
      groupId: t.groupId ? Number(t.groupId) : null,
      desc: String(t.desc || 'Sem descrição').trim(),
      valor: parseFloat(valor.toFixed(2)),
      tipo: t.tipo === 'receita' ? 'receita' : 'despesa',
      frequencia: ['unico', 'parcelado', 'recorrente'].includes(t.frequencia) ? t.frequencia : 'unico',
      categoria: String(t.categoria || 'Outros').trim(),
      data: String(t.data || new Date().toISOString().split('T')[0]).slice(0, 10)
    };
  }

  /**
   * Carrega os dados persistidos no localStorage
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        transacoes = [];
      } else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          transacoes = parsed
            .map(validateAndNormalize)
            .filter(Boolean);
        } else {
          transacoes = [];
        }
      }
    } catch (err) {
      console.warn('Falha ao ler dados do localStorage:', err);
      transacoes = [];
    }
    return transacoes;
  }

  /**
   * Salva os dados no localStorage e notifica os observadores
   */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacoes));
    } catch (err) {
      console.error('Erro ao salvar transações no localStorage:', err);
      if (Utils && Utils.showToast) {
        Utils.showToast('Limite de armazenamento atingido ou erro ao salvar.', 'error');
      }
    }
    notify();
  }

  /**
   * Retorna uma cópia das transações em memória
   */
  function getAll() {
    return [...transacoes];
  }

  /**
   * Adiciona uma ou mais transações
   */
  function add(itens) {
    const novos = Array.isArray(itens) ? itens : [itens];
    const validados = novos.map(validateAndNormalize).filter(Boolean);
    if (validados.length === 0) return false;

    // Adiciona no início
    transacoes = [...validados, ...transacoes];
    save();
    return true;
  }

  /**
   * Remove uma transação específica por ID
   */
  function remove(id) {
    const lenAntes = transacoes.length;
    transacoes = transacoes.filter(t => t.id !== Number(id));
    if (transacoes.length !== lenAntes) {
      save();
      return true;
    }
    return false;
  }

  /**
   * Remove todas as transações de um mesmo grupo (parcelas ou recorrências)
   */
  function removeGroup(groupId) {
    if (!groupId) return false;
    const lenAntes = transacoes.length;
    transacoes = transacoes.filter(t => t.groupId !== Number(groupId));
    if (transacoes.length !== lenAntes) {
      save();
      return true;
    }
    return false;
  }

  /**
   * Limpa todo o histórico
   */
  function clearAll() {
    transacoes = [];
    save();
  }

  /**
   * Exporta arquivo JSON de backup
   */
  function exportBackup() {
    if (transacoes.length === 0) {
      if (Utils && Utils.showToast) {
        Utils.showToast('Não há lançamentos cadastrados para exportar.', 'warning');
      }
      return false;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transacoes, null, 2));
    const dataHoje = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `financas_backup_${dataHoje}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (Utils && Utils.showToast) {
      Utils.showToast('Backup exportado com sucesso!', 'success');
    }
    return true;
  }

  /**
   * Importa e valida arquivo JSON de backup
   */
  function importBackup(fileContent, mode = 'replace') {
    try {
      const parsed = JSON.parse(fileContent);
      if (!Array.isArray(parsed)) {
        throw new Error('O arquivo não contém uma lista válida de lançamentos.');
      }

      const validados = parsed.map(validateAndNormalize).filter(Boolean);
      if (validados.length === 0 && parsed.length > 0) {
        throw new Error('Nenhum registro pôde ser validado no arquivo.');
      }

      if (mode === 'replace') {
        transacoes = validados;
      } else {
        // Mesclagem com desduplicação por ID
        const idsExistentes = new Set(transacoes.map(t => t.id));
        const novos = validados.filter(t => !idsExistentes.has(t.id));
        transacoes = [...transacoes, ...novos];
      }

      save();
      return { success: true, count: validados.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Gerenciamento de Tema (Dark / Light)
   */
  function getTheme() {
    const salvo = localStorage.getItem(THEME_KEY);
    if (salvo === 'dark' || salvo === 'light') return salvo;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(tema) {
    const novoTema = tema === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, novoTema);
    applyTheme(novoTema);
  }

  function toggleTheme() {
    const atual = getTheme();
    const proximo = atual === 'dark' ? 'light' : 'dark';
    setTheme(proximo);
    return proximo;
  }

  function applyTheme(tema) {
    const rootEl = document.documentElement;
    if (tema === 'dark') {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }

  // Inicializa tema no carregamento do script
  applyTheme(getTheme());

  return {
    load,
    getAll,
    add,
    remove,
    removeGroup,
    clearAll,
    exportBackup,
    importBackup,
    subscribe,
    getTheme,
    setTheme,
    toggleTheme,
    applyTheme
  };
});
