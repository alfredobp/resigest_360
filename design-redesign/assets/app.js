/* ==========================================================================
   RESIGEST 360 - REDESIGN INTERACTIVE CONTROLLER
   Synchronizes Visual Variant (industrial | bento | erp) and Mode (light | dark)
   across the Hub (index.html) and every standalone screen HTML.
   ========================================================================== */
(function () {
  const DEFAULT_VARIANT = 'industrial';
  const DEFAULT_MODE = 'light';

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      v: p.get('v'),
      m: p.get('m'),
    };
  }

  function applyTheme(variant, mode, persist = true) {
    const v = ['industrial', 'bento', 'erp'].includes(variant) ? variant : DEFAULT_VARIANT;
    const m = ['light', 'dark'].includes(mode) ? mode : DEFAULT_MODE;
    document.documentElement.setAttribute('data-variant', v);
    document.documentElement.setAttribute('data-mode', m);

    if (persist) {
      try {
        localStorage.setItem('resigest_redesign_variant', v);
        localStorage.setItem('resigest_redesign_mode', m);
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }

    document.querySelectorAll('[data-set-variant]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-set-variant') === v);
    });
    document.querySelectorAll('[data-toggle-mode]').forEach((btn) => {
      btn.textContent = m === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
    });
  }

  // Detect iframe embedding
  if (window.self !== window.top) {
    document.documentElement.classList.add('in-iframe');
  }

  // Init from URL or localStorage
  const params = getParams();
  let savedV = DEFAULT_VARIANT;
  let savedM = DEFAULT_MODE;
  try {
    savedV = localStorage.getItem('resigest_redesign_variant') || DEFAULT_VARIANT;
    savedM = localStorage.getItem('resigest_redesign_mode') || DEFAULT_MODE;
  } catch (_) {}

  applyTheme(params.v || savedV, params.m || savedM, false);

  // Listen to parent Hub messages
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RESIGEST_THEME_CHANGE') {
      applyTheme(event.data.variant, event.data.mode, true);
    }
  });

  // Inject floating switcher for standalone viewing
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.standalone-switcher') && !document.documentElement.classList.contains('is-hub')) {
      const bar = document.createElement('div');
      bar.className = 'standalone-switcher';
      bar.innerHTML = `
        <button class="sw-btn" data-set-variant="industrial">1. Industrial</button>
        <button class="sw-btn" data-set-variant="bento">2. Eco-Bento</button>
        <button class="sw-btn" data-set-variant="erp">3. ERP Denso</button>
        <span class="sw-sep"></span>
        <button class="sw-btn" data-toggle-mode>🌙 Oscuro</button>
        <span class="sw-sep"></span>
        <a href="../index.html" class="sw-btn" style="color:#6ee7b7">← Hub</a>
      `;
      document.body.appendChild(bar);
      applyTheme(
        document.documentElement.getAttribute('data-variant'),
        document.documentElement.getAttribute('data-mode'),
        false
      );
    }

    // Bind variant buttons
    document.addEventListener('click', (e) => {
      const vBtn = e.target.closest('[data-set-variant]');
      if (vBtn) {
        const nextV = vBtn.getAttribute('data-set-variant');
        const curM = document.documentElement.getAttribute('data-mode') || DEFAULT_MODE;
        applyTheme(nextV, curM, true);
      }
      const mBtn = e.target.closest('[data-toggle-mode]');
      if (mBtn) {
        const curV = document.documentElement.getAttribute('data-variant') || DEFAULT_VARIANT;
        const curM = document.documentElement.getAttribute('data-mode') || DEFAULT_MODE;
        applyTheme(curV, curM === 'dark' ? 'light' : 'dark', true);
      }

      // Generic interactive tabs
      const tabBtn = e.target.closest('[data-tab-target]');
      if (tabBtn) {
        const group = tabBtn.closest('[data-tab-group]');
        const targetId = tabBtn.getAttribute('data-tab-target');
        if (group) {
          group.querySelectorAll('[data-tab-target]').forEach((b) => b.classList.remove('active'));
          tabBtn.classList.add('active');
          const panelsScope = document.querySelector(`[data-tab-panels="${group.getAttribute('data-tab-group')}"]`) || document;
          panelsScope.querySelectorAll('[data-tab-panel]').forEach((p) => {
            p.style.display = p.getAttribute('data-tab-panel') === targetId ? '' : 'none';
          });
        }
      }
    });

    // Live table search filter
    document.querySelectorAll('[data-table-search]').forEach((input) => {
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        const tableId = input.getAttribute('data-table-search');
        const rows = document.querySelectorAll(`#${tableId} tbody tr`);
        rows.forEach((row) => {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    });
  });

  window.ResigestRedesign = { applyTheme };
})();

