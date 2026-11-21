/* Shared Admin Shell Renderer (Sidebar + Topbar) for ResiGest 360 Redesign Screens */
(function () {
  const NAV_GROUPS = [
    {
      label: 'Operativa',
      items: [
        { id: 'dashboard', name: 'Dashboard Ejecutivo', href: 'dashboard.html', icon: 'grid' },
        { id: 'di', name: 'Documentos DI', href: 'documentos-identificacion.html', icon: 'file', badge: '4', badgeType: 'alert' },
        { id: 'nt', name: 'Notificaciones NT', href: 'notificaciones-previas.html', icon: 'bell' },
        { id: 'contratos', name: 'Contratos', href: 'contratos.html', icon: 'shield', badge: '2' },
        { id: 'operaciones', name: 'Operaciones Com.', href: 'operaciones.html', icon: 'euro' },
      ],
    },
    {
      label: 'Normativa',
      items: [
        { id: 'cronologico', name: 'Archivo Cronológico', href: 'archivo-cronologico.html', icon: 'book' },
        { id: 'memorias', name: 'Memorias Anuales', href: 'memorias-anuales.html', icon: 'chart' },
        { id: 'deca', name: 'Control DeCA', href: 'deca.html', icon: 'truck' },
      ],
    },
    {
      label: 'Actores y Sistema',
      items: [
        { id: 'actores', name: 'Empresas y Gestores', href: 'empresas-actores.html', icon: 'building' },
        { id: 'integraciones', name: 'Integraciones SIRA', href: 'integraciones.html', icon: 'plug' },
        { id: 'conductor', name: 'Vista Conductor', href: 'vista-conductor.html', icon: 'phone' },
      ],
    },
  ];

  const ICONS = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 5.5A7.5 7.5 0 1 0 19 18.5M4 10h10M4 14h9"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01"/></svg>',
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
  };

  document.addEventListener('DOMContentLoaded', () => {
    const activeId = document.body.getAttribute('data-nav');
    const sidebarMount = document.getElementById('app-sidebar');
    const topbarMount = document.getElementById('app-topbar');

    if (sidebarMount) {
      sidebarMount.className = 'sidebar';
      sidebarMount.innerHTML = `
        <div class="sidebar-brand">
          <div class="brand-mark">R3</div>
          <div class="brand-name">ResiGest <span>360</span></div>
        </div>
        <nav class="sidebar-nav">
          ${NAV_GROUPS.map(
            (g) => `
            <div>
              <div class="nav-group-label">${g.label}</div>
              ${g.items
                .map(
                  (it) => `
                <a href="${it.href}" class="nav-item ${it.id === activeId ? 'active' : ''}">
                  ${ICONS[it.icon] || ''}
                  <span>${it.name}</span>
                  ${it.badge ? `<span class="nav-badge ${it.badgeType || ''}">${it.badge}</span>` : ''}
                </a>
              `
                )
                .join('')}
            </div>
          `
          ).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="tenant-box">
            <div class="tenant-box-title">Eco-Valorizaciones Ibéricas S.L.</div>
            <div class="tenant-box-sub">Perfil: Gestor RP & Chatarrería</div>
          </div>
        </div>
      `;
    }

    if (topbarMount) {
      topbarMount.className = 'topbar';
      topbarMount.innerHTML = `
        <div class="search-trigger" title="Paleta de comandos global">
          <span>🔍</span>
          <span style="font-size:12.5px">Buscar DI, código LER, NIMA o comando...</span>
          <span class="search-kbd">⌘ K</span>
        </div>
        <div class="topbar-right">
          <div class="pill-select">
            <span class="dot-live"></span>
            <span>Centro: Planta Valdemoro (NIMA 2800049182)</span>
          </div>
          <div class="pill-select" style="color:var(--brand)">SIRA e3l v3.6 · OK</div>
          <div class="avatar" title="Alfredo · Director Ambiental">AL</div>
        </div>
      `;
    }
  });
})();

