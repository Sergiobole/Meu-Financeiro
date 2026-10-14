/**
 * Ponto de entrada da aplicação (Bootstrap e Inicialização de Eventos)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const Financas = window.Financas;
    if (!Financas) {
      console.error('Módulos do Financas não foram carregados corretamente.');
      return;
    }

    const { State, UI, Utils } = Financas;

    // Carrega dados persistidos
    State.load();

    // Inscreve a UI para re-renderizar sempre que o estado mudar
    State.subscribe(() => {
      UI.render();
    });

    // Inicialização da Data e Filtros de Período
    const hoje = new Date();
    const dataInput = document.getElementById('data');
    if (dataInput) {
      dataInput.valueAsDate = hoje;
    }

    const filtroMes = document.getElementById('filtroMes');
    if (filtroMes) {
      filtroMes.value = hoje.getMonth();
    }

    // Preenche os anos disponíveis no filtro
    UI.updateYearOptions();

    // Inicializa campos de parcelamento e recorrência
    UI.adjustFrequencyFields();

    // Inicializa ícone do botão de Tema
    UI.updateThemeButton();

    // Renderiza a interface inicial
    UI.render();

    // -------------------------------------------------------------------------
    // Associação de Eventos do DOM
    // -------------------------------------------------------------------------

    // Formulário de Transação
    const form = document.getElementById('formTransacao');
    if (form) {
      form.addEventListener('submit', UI.handleFormSubmit);
    }

    const selectFreq = document.getElementById('frequencia');
    if (selectFreq) {
      selectFreq.addEventListener('change', UI.adjustFrequencyFields);
    }

    // Filtros de Período
    if (filtroMes) filtroMes.addEventListener('change', UI.render);
    const filtroAno = document.getElementById('filtroAno');
    if (filtroAno) filtroAno.addEventListener('change', UI.render);

    // Filtros do Extrato
    const filtroFluxo = document.getElementById('filtroTipoFluxo');
    if (filtroFluxo) filtroFluxo.addEventListener('change', UI.render);

    const filtroMod = document.getElementById('filtroModalidade');
    if (filtroMod) filtroMod.addEventListener('change', UI.render);

    const filtroOrd = document.getElementById('filtroOrdenacao');
    if (filtroOrd) filtroOrd.addEventListener('change', UI.render);

    const buscaTexto = document.getElementById('campoBuscaTexto');
    if (buscaTexto) buscaTexto.addEventListener('input', UI.render);

    const btnLimparBusca = document.getElementById('btnLimparBusca');
    if (btnLimparBusca) btnLimparBusca.addEventListener('click', UI.clearSearchText);

    // Barra Superior / Ações Globais
    const btnTema = document.getElementById('btnToggleTheme');
    if (btnTema) btnTema.addEventListener('click', UI.toggleTheme);

    const btnRelatorio = document.getElementById('btnAbrirRelatorio');
    if (btnRelatorio) btnRelatorio.addEventListener('click', UI.openReportModal);

    const btnBackup = document.getElementById('btnExportarBackup');
    if (btnBackup) btnBackup.addEventListener('click', State.exportBackup);

    const inputImport = document.getElementById('inputImportar');
    if (inputImport) inputImport.addEventListener('change', UI.handleImportFile);

    const btnResetar = document.getElementById('btnResetar');
    if (btnResetar) btnResetar.addEventListener('click', UI.handleResetAll);

    // Modal de Relatório PDF
    const btnFecharModalRel = document.getElementById('btnFecharModalRel');
    if (btnFecharModalRel) btnFecharModalRel.addEventListener('click', UI.closeReportModal);

    const btnCancelarRel = document.getElementById('btnCancelarRel');
    if (btnCancelarRel) btnCancelarRel.addEventListener('click', UI.closeReportModal);

    const btnConfirmarPdf = document.getElementById('btnConfirmarPdf');
    if (btnConfirmarPdf) btnConfirmarPdf.addEventListener('click', UI.handleGeneratePdf);

    // -------------------------------------------------------------------------
    // Suporte a PWA (Service Worker e Instalação)
    // -------------------------------------------------------------------------
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('PWA: Service Worker registrado com sucesso:', reg.scope);
          })
          .catch(err => {
            console.log('PWA: Falha ao registrar Service Worker (comum em ambiente local sem HTTPS):', err);
          });
      });
    }

    // Notificação / botão de instalação do PWA
    let deferredPrompt = null;
    const btnInstalarPwa = document.getElementById('btnInstalarPwa');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnInstalarPwa) {
        btnInstalarPwa.classList.remove('hidden');
        btnInstalarPwa.addEventListener('click', () => {
          btnInstalarPwa.classList.add('hidden');
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              Utils.showToast('Aplicativo instalado com sucesso!', 'success');
            }
            deferredPrompt = null;
          });
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      if (btnInstalarPwa) btnInstalarPwa.classList.add('hidden');
      Utils.showToast('Minhas Finanças instalado como aplicativo!', 'success');
    });
  });
})();
