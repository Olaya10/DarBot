// =====================================================================
//  DARBOT — ADMIN SPA  (versión final unificada)
//  ---------------------------------------------------------------------
//  Incluye:
//   - Login page handler
//   - Router SPA (dashboard, usuarios, contenidos, institucional,
//                 chatbot, cache, galeria)
//   - CRUD completo de usuarios, contenidos, chatbot y galería
//   - Modales accesibles (showModal / closeModal)
//   - Funciones globales (window.*) para onclick inline del partial
// =====================================================================

const API_BASE_HOST = (location.port && location.port !== '8080')
  ? `${location.protocol}//${location.hostname}:8080`
  : '';
const API_BASE = `${API_BASE_HOST}/api`;

function getToken() { return localStorage.getItem('darbot_token'); }
function setToken(t) {
  if (t) localStorage.setItem('darbot_token', t);
  else localStorage.removeItem('darbot_token');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'error' ? 'danger' : 'success'} shadow-lg`;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;border-radius:12px;animation:slideUp 0.3s ease;';
  toast.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-check'} me-2"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    'Accept': 'application/json',
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + endpoint, { headers, ...options });
  if (res.status === 204) return null;

  if (res.status === 401 || res.status === 403) {
    setToken(null);
    if (location.pathname.includes('/admin')) {
      location.href = 'login.html';
    }
    const text = await res.text().catch(() => null);
    throw new Error(text || 'No autorizado');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || res.statusText || 'Error en la petición');
  }

  return res.json();
}

function showModal(contentHtml) {
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal';
  overlay.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${contentHtml}</div>`;
  document.body.appendChild(overlay);

  const modalBox = overlay.querySelector('.modal-box');
  const firstFocusable = modalBox.querySelector('input,textarea,select,button,a,[tabindex]');
  const h = modalBox.querySelector('h3');
  if (h) modalBox.setAttribute('aria-label', h.textContent.trim());
  if (firstFocusable) firstFocusable.focus();

  function keyHandler(e) {
    if (e.key === 'Escape') closeModal(overlay);
    if (e.key === 'Tab') {
      const focusables = modalBox.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  overlay._keyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  return overlay;
}

function closeModal(overlay) {
  if (!overlay) return;
  if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
  overlay.remove();
}

// ==================== LOGIN PAGE ====================
if (location.pathname.endsWith('/login.html') || location.pathname.endsWith('/admin/login.html')) {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.classList.add('d-none');
        errorEl.textContent = '';
      }

      const username = form.username.value.trim();
      const password = form.password.value;

      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        setToken(data.token);
        location.href = 'index.html';
      } catch (err) {
        if (errorEl) {
          errorEl.classList.remove('d-none');
          errorEl.textContent = err.message || 'Credenciales no válidas.';
        }
      }
    });
  }
}

// ==================== ADMIN SPA ====================
const isAdminSPA = location.pathname.endsWith('/admin/') ||
  location.pathname.endsWith('/admin/index.html') ||
  location.pathname.endsWith('/admin');

if (isAdminSPA) {
  const routes = document.querySelectorAll('[data-route]');
  const viewContainer = document.getElementById('viewContainer');
  const pageTitle = document.getElementById('pageTitle');
  const logoutBtn = document.getElementById('logoutBtn');
  const currentUsernameEl = document.getElementById('currentUsername');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const adminSidebar = document.getElementById('adminSidebar');

  let currentUser = null;

  async function loadCurrentUser() {
    try {
      currentUser = await apiFetch('/auth/me');
      if (currentUsernameEl && currentUser) {
        currentUsernameEl.textContent = currentUser.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : currentUser.username;
      }
    } catch (err) {
      currentUser = null;
      setToken(null);
      location.href = 'login.html';
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setToken(null);
      location.href = 'login.html';
    });
  }

  if (sidebarToggleBtn && adminSidebar) {
    sidebarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adminSidebar.classList.toggle('open');
    });
    
    // Cerrar sidebar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (adminSidebar.classList.contains('open')) {
        // Si el click NO es dentro del sidebar NI en el botón toggle
        if (!adminSidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
          adminSidebar.classList.remove('open');
        }
      }
    });
    
    // Cerrar sidebar al presionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && adminSidebar.classList.contains('open')) {
        adminSidebar.classList.remove('open');
      }
    });
  }

  // --- Router handler ---
  // ═══════════════════════════════════════════════════════
// SIDEBAR MEJORADA - Colapsar, buscar, overlay
// ═══════════════════════════════════════════════════════
function inicializarSidebarMejorada() {
  const sidebar = document.getElementById('adminSidebar');
  const searchInput = document.getElementById('sidebarSearch');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  
  if (!sidebar) return;
  
  // 1. Búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const navLinks = sidebar.querySelectorAll('.nav-link[data-route]');
      const sections = sidebar.querySelectorAll('.nav-section');
      
      if (!query) {
        navLinks.forEach(link => link.classList.remove('hidden'));
        sections.forEach(sec => sec.classList.remove('hidden'));
        return;
      }
      
      navLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const route = link.getAttribute('data-route').toLowerCase();
        if (text.includes(query) || route.includes(query)) {
          link.classList.remove('hidden');
        } else {
          link.classList.add('hidden');
        }
      });
      
      sections.forEach(sec => {
        const visibleLinks = sec.querySelectorAll('.nav-link:not(.hidden)');
        if (visibleLinks.length === 0) {
          sec.classList.add('hidden');
        } else {
          sec.classList.remove('hidden');
        }
      });
    });
  }
  
  // 4. Overlay en móvil
  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);
  }
  
  const cerrarSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  };
  
  if (sidebarToggleBtn) {
    const nuevoToggle = sidebarToggleBtn.cloneNode(true);
    sidebarToggleBtn.parentNode.replaceChild(nuevoToggle, sidebarToggleBtn);
    
    nuevoToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('open')) {
        cerrarSidebar();
      } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
      }
    });
  }
  
  overlay.addEventListener('click', cerrarSidebar);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      cerrarSidebar();
    }
  });
  
  sidebar.querySelectorAll('.nav-link[data-route]').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        setTimeout(cerrarSidebar, 150);
      }
    });
  });
  
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
      cerrarSidebar();
    }
  });
}

// ═══════════════════════════════════════════════════════
// TOPBAR - Notificaciones y perfil
// ═══════════════════════════════════════════════════════
function inicializarTopbarListeners() {
  const notifBtn = document.getElementById('notifBtn');
  const topbarProfile = document.getElementById('topbarProfile');
  
  // ─────────────────────────────────────────────────────
  // 1. Notificaciones - Mostrar panel de pendientes
  // ─────────────────────────────────────────────────────
  if (notifBtn) {
    notifBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      // Si ya hay un dropdown, cerrarlo
      const existingDropdown = document.getElementById('notifDropdown');
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      
      // Crear dropdown
      const dropdown = document.createElement('div');
      dropdown.id = 'notifDropdown';
      dropdown.className = 'topbar-dropdown notif-dropdown';
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <strong>Notificaciones</strong>
          <button class="dropdown-close" onclick="document.getElementById('notifDropdown').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="dropdown-body" id="notifDropdownBody">
          <div class="text-center py-3 text-muted">
            <div class="spinner-border spinner-border-sm text-danger"></div>
          </div>
        </div>
      `;
      
      notifBtn.parentElement.appendChild(dropdown);
      
      // Cargar pendientes
      try {
        const pendientes = await apiFetch('/admin/chatbot/preguntas?resuelta=false');
        
        const body = document.getElementById('notifDropdownBody');
        if (body) {
          if (pendientes.length === 0) {
            body.innerHTML = `
              <div class="text-center py-4">
                <i class="fa-solid fa-check-circle fa-2x text-success mb-2"></i>
                <p class="text-muted small mb-0">¡Sin notificaciones pendientes!</p>
              </div>
            `;
          } else {
            body.innerHTML = `
              <div class="notif-list">
                ${pendientes.slice(0, 5).map(p => `
                  <div class="notif-item">
                    <div class="notif-item-icon">
                      <i class="fa-solid fa-circle-question"></i>
                    </div>
                    <div class="notif-item-content">
                      <div class="notif-item-text">"${p.pregunta}"</div>
                      <div class="notif-item-date">${p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="btn btn-admin-primary btn-sm w-100 mt-2" onclick="document.querySelector('[data-route=estadisticas-chatbot]').click(); document.getElementById('notifDropdown')?.remove();">
                Ver todas las ${pendientes.length} preguntas
              </button>
            `;
          }
        }
      } catch (err) {
        const body = document.getElementById('notifDropdownBody');
        if (body) {
          body.innerHTML = `<div class="text-center py-3 text-danger small">Error al cargar</div>`;
        }
      }
      
      // Cerrar al click afuera
      setTimeout(() => {
        const closeHandler = (ev) => {
          if (!dropdown.contains(ev.target) && !notifBtn.contains(ev.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 100);
    });
  }
  
  // ─────────────────────────────────────────────────────
  // 2. Perfil - Mostrar menú de usuario
  // ─────────────────────────────────────────────────────
  if (topbarProfile) {
    topbarProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Si ya hay un dropdown, cerrarlo
      const existingDropdown = document.getElementById('profileDropdown');
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      
      // Obtener nombre del usuario
      const userName = document.getElementById('currentUsername')?.textContent || 'Admin';
      
      // Crear dropdown
      const dropdown = document.createElement('div');
      dropdown.id = 'profileDropdown';
      dropdown.className = 'topbar-dropdown profile-dropdown';
      dropdown.innerHTML = `
        <div class="profile-dropdown-header">
          <div class="user-avatar-lg">
            <i class="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <strong class="d-block">${userName}</strong>
            <small class="text-muted">Administrador</small>
          </div>
        </div>
        <div class="profile-dropdown-body">
          <a href="#" class="dropdown-item" id="dropdownProfile">
            <i class="fa-solid fa-user"></i> Mi Perfil
          </a>
          <a href="#" class="dropdown-item" id="dropdownConfig">
            <i class="fa-solid fa-gear"></i> Configuración
          </a>
          <a href="../index.html" target="_blank" class="dropdown-item">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Sitio Público
          </a>
          <div class="dropdown-divider"></div>
          <a href="#" class="dropdown-item dropdown-item-danger" id="dropdownLogout">
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </a>
        </div>
      `;
      
      topbarProfile.parentElement.appendChild(dropdown);
      
      // Listeners
      document.getElementById('dropdownLogout')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        setToken(null);
        location.href = 'login.html';
      });
      
      document.getElementById('dropdownProfile')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.querySelector('[data-route=perfil]')?.click();
        dropdown.remove();
      });
      
      document.getElementById('dropdownConfig')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.querySelector('[data-route=configuracion]')?.click();
        dropdown.remove();
      });
      
      // Cerrar al click afuera
      setTimeout(() => {
        const closeHandler = (ev) => {
          if (!dropdown.contains(ev.target) && !topbarProfile.contains(ev.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 100);
    });
  }
}

// ═══════════════════════════════════════════════════════
// BREADCRUMB
// ═══════════════════════════════════════════════════════
const ROUTE_TITLES = {
  'dashboard': 'Dashboard',
  'usuarios': 'Gestión de Usuarios',
  'contenidos': 'Contenidos',
  'institucional': 'Información Institucional',
  'galeria': 'Galería',
  'estadisticas': 'Estadísticas Home',
  'equipo': 'Equipo Directivo',
  'valores': 'Valores Institucionales',
  'servicios': 'Servicios',
  'configuracion': 'Configuración General',
  'chatbot': 'Entrenamiento del Chatbot',
  'estadisticas-chatbot': 'Estadísticas del Chatbot',
  'cache': 'Gestión de Caché'
};

function actualizarBreadcrumb(route) {
  const el = document.getElementById('breadcrumbCurrent');
  if (el) el.textContent = ROUTE_TITLES[route] || route;
}

// ═══════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════
async function cargarNotificaciones() {
  try {
    const pendientes = await apiFetch('/admin/chatbot/preguntas?resuelta=false');
    const total = pendientes.length;
    
    const badgeNav = document.getElementById('badgePendientesNav');
    if (badgeNav) {
      if (total > 0) {
        badgeNav.textContent = total;
        badgeNav.style.display = 'inline-flex';
      } else {
        badgeNav.style.display = 'none';
      }
    }
    
    const badgeTop = document.getElementById('notifBadge');
    if (badgeTop) {
      if (total > 0) {
        badgeTop.textContent = total;
        badgeTop.style.display = 'flex';
      } else {
        badgeTop.style.display = 'none';
      }
    }
  } catch (e) {
    console.warn('No se pudieron cargar notificaciones:', e);
  }
}

function navigate(route) {
    routes.forEach(r => {
      if (r.getAttribute('data-route') === route) {
        r.classList.add('active');
      } else {
        r.classList.remove('active');
      }
    });

    if (adminSidebar) adminSidebar.classList.remove('open');

    switch (route) {
      case 'dashboard': renderDashboard(); break;
      case 'perfil': renderPerfil(); break;
      case 'usuarios': renderUsuarios(); break;
      case 'contenidos': renderContenidos(); break;
      case 'institucional': renderInstitucional(); break;
      case 'chatbot': renderChatbot(); break;
      case 'estadisticas-chatbot': renderEstadisticasChatbot(); break;
      case 'cache': renderCache(); break;
      case 'galeria': renderGaleria(); break;
      case 'estadisticas': renderEstadisticas(); break;
      case 'equipo': renderEquipo(); break;
      case 'valores': renderValores(); break;
      case 'servicios': renderServicios(); break;
      case 'configuracion': renderConfiguracion(); break;
      default: renderDashboard(); break;
    }
  }

  routes.forEach(r => {
    r.addEventListener('click', (e) => {
      e.preventDefault();
      const route = r.getAttribute('data-route');
      navigate(route);
    });
  });

  // ==================== VIEWS ====================

  async function renderDashboard() {
  pageTitle.textContent = 'Dashboard';
  viewContainer.innerHTML = `
    <!-- ═══════════════════════════════════════════════════ -->
    <!-- KPIs PRINCIPALES -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="kpi-card">
          <div class="kpi-icon primary"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="kpi-number" id="dashUsersCount">-</div>
            <div class="kpi-label">Usuarios</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="kpi-card">
          <div class="kpi-icon success"><i class="fa-solid fa-newspaper"></i></div>
          <div>
            <div class="kpi-number" id="dashNewsCount">-</div>
            <div class="kpi-label">Noticias</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="kpi-card">
          <div class="kpi-icon warning"><i class="fa-solid fa-calendar-check"></i></div>
          <div>
            <div class="kpi-number" id="dashEventsCount">-</div>
            <div class="kpi-label">Eventos</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="kpi-card">
          <div class="kpi-icon info"><i class="fa-solid fa-image"></i></div>
          <div>
            <div class="kpi-number" id="dashGalleryCount">-</div>
            <div class="kpi-label">Imágenes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- MÉTRICAS DEL CHATBOT -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card-admin">
          <div class="card-admin-header d-flex justify-content-between align-items-center">
            <h2 class="card-admin-title mb-0">
              <i class="fa-solid fa-robot me-2 text-danger"></i>Rendimiento del Chatbot
            </h2>
            <button class="btn btn-admin-outline btn-sm" onclick="document.querySelector('[data-route=estadisticas-chatbot]').click()">
              Ver detalle <i class="fa-solid fa-arrow-right ms-1"></i>
            </button>
          </div>
          <div class="card-admin-body">
            <div class="row g-3">
              <div class="col-6 col-md-3">
                <div class="chatbot-metric">
                  <div class="metric-icon" style="background: rgba(200,16,46,0.1); color: #c8102e;">
                    <i class="fa-solid fa-comments"></i>
                  </div>
                  <div class="metric-value" id="dashChatConversaciones">-</div>
                  <div class="metric-label">Conversaciones</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="chatbot-metric">
                  <div class="metric-icon" style="background: rgba(37,99,235,0.1); color: #2563eb;">
                    <i class="fa-solid fa-envelope"></i>
                  </div>
                  <div class="metric-value" id="dashChatMensajes">-</div>
                  <div class="metric-label">Mensajes</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="chatbot-metric">
                  <div class="metric-icon" style="background: rgba(34,197,94,0.1); color: #22c55e;">
                    <i class="fa-solid fa-circle-check"></i>
                  </div>
                  <div class="metric-value" id="dashChatPrecision">-</div>
                  <div class="metric-label">Precisión</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="chatbot-metric">
                  <div class="metric-icon" style="background: rgba(245,158,11,0.1); color: #f59e0b;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div class="metric-value" id="dashChatPendientes">-</div>
                  <div class="metric-label">Sin Respuesta</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- ACCESOS RÁPIDOS + ESTADO DEL SISTEMA -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="row g-4 mb-4">
      <div class="col-lg-7">
        <div class="card-admin h-100">
          <div class="card-admin-header">
            <h2 class="card-admin-title">
              <i class="fa-solid fa-rocket me-2 text-danger"></i>Accesos Rápidos
            </h2>
          </div>
          <div class="card-admin-body">
            <div class="row g-3">
              <div class="col-sm-6">
                <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=usuarios]').click()">
                  <i class="fa-solid fa-user-plus text-danger fs-4"></i>
                  <div>
                    <strong class="d-block">Gestión de Usuarios</strong>
                    <small class="text-muted">Crear y administrar cuentas</small>
                  </div>
                </button>
              </div>
              <div class="col-sm-6">
                <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=contenidos]').click()">
                  <i class="fa-solid fa-pen-to-square text-danger fs-4"></i>
                  <div>
                    <strong class="d-block">Publicar Contenidos</strong>
                    <small class="text-muted">Noticias, eventos, documentos</small>
                  </div>
                </button>
              </div>
              <div class="col-sm-6">
                <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=chatbot]').click()">
                  <i class="fa-solid fa-comments text-danger fs-4"></i>
                  <div>
                    <strong class="d-block">Entrenar Chatbot</strong>
                    <small class="text-muted">Intenciones y FAQs</small>
                  </div>
                </button>
              </div>
              <div class="col-sm-6">
                <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=galeria]').click()">
                  <i class="fa-solid fa-image text-danger fs-4"></i>
                  <div>
                    <strong class="d-block">Galería Institucional</strong>
                    <small class="text-muted">Subir y organizar imágenes</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card-admin h-100">
          <div class="card-admin-header d-flex justify-content-between align-items-center">
            <h2 class="card-admin-title mb-0">
              <i class="fa-solid fa-shield-heart me-2 text-success"></i>Estado del Sistema
            </h2>
            <button id="refreshStatusBtn" class="btn btn-admin-outline btn-sm" title="Actualizar">
              <i class="fa-solid fa-rotate"></i>
            </button>
          </div>
          <div class="card-admin-body">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <span class="text-muted small d-block">Servidor API</span>
                <span class="text-muted" style="font-size:0.7rem;" id="statusApiTime">Verificando...</span>
              </div>
              <span class="status-pill" id="statusApi">
                <i class="fa-solid fa-spinner fa-spin me-1"></i>Verificando
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <span class="text-muted small d-block">Base de Datos</span>
                <span class="text-muted" style="font-size:0.7rem;" id="statusDbInfo">Cargando...</span>
              </div>
              <span class="status-pill" id="statusDb">
                <i class="fa-solid fa-spinner fa-spin me-1"></i>Verificando
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <span class="text-muted small d-block">Motor de Chatbot</span>
                <span class="text-muted" style="font-size:0.7rem;" id="statusChatInfo">Cargando...</span>
              </div>
              <span class="status-pill" id="statusChat">
                <i class="fa-solid fa-spinner fa-spin me-1"></i>Verificando
              </span>
            </div>
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted small d-block">Almacenamiento</span>
                <span class="text-muted" style="font-size:0.7rem;" id="statusStorageInfo">Cargando...</span>
              </div>
              <span class="status-pill" id="statusStorage">
                <i class="fa-solid fa-spinner fa-spin me-1"></i>Verificando
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- ACTIVIDAD + PENDIENTES -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="row g-4">
      <div class="col-lg-7">
        <div class="card-admin h-100">
          <div class="card-admin-header">
            <h2 class="card-admin-title">
              <i class="fa-solid fa-chart-line me-2 text-danger"></i>Actividad de Mensajes (Últimos 7 días)
            </h2>
          </div>
          <div class="card-admin-body">
            <div id="dashActividad" class="dash-actividad">
              <div class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-danger"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card-admin h-100">
          <div class="card-admin-header d-flex justify-content-between align-items-center">
            <h2 class="card-admin-title mb-0">
              <i class="fa-solid fa-circle-question me-2 text-warning"></i>Preguntas Pendientes
            </h2>
            <span class="badge bg-warning" id="dashPendientesBadge">0</span>
          </div>
          <div class="card-admin-body" id="dashPendientes">
            <div class="text-center py-4 text-muted">
              <div class="spinner-border spinner-border-sm text-danger"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ═══════════════════════════════════════════════════════
  // CARGAR MÉTRICAS
  // ═══════════════════════════════════════════════════════
  try {
    const [users, news, events, gallery, stats] = await Promise.all([
      apiFetch('/admin/usuarios').catch(() => []),
      apiFetch('/admin/contenidos/noticias').catch(() => []),
      apiFetch('/admin/contenidos/eventos').catch(() => []),
      apiFetch('/admin/galeria').catch(() => []),
      apiFetch('/admin/chatbot/estadisticas').catch(() => null)
    ]);

    // KPIs principales
    const uEl = document.getElementById('dashUsersCount'); if (uEl) uEl.textContent = users.length;
    const nEl = document.getElementById('dashNewsCount'); if (nEl) nEl.textContent = news.length;
    const eEl = document.getElementById('dashEventsCount'); if (eEl) eEl.textContent = events.length;
    const gEl = document.getElementById('dashGalleryCount'); if (gEl) gEl.textContent = gallery.length;

    // Métricas del chatbot
    if (stats) {
      const cEl = document.getElementById('dashChatConversaciones'); 
      if (cEl) cEl.textContent = (stats.totalConversaciones || 0).toLocaleString();
      
      const mEl = document.getElementById('dashChatMensajes'); 
      if (mEl) mEl.textContent = (stats.totalMensajes || 0).toLocaleString();
      
      const pEl = document.getElementById('dashChatPrecision'); 
      if (pEl) pEl.textContent = (stats.porcentajeExito || 0).toFixed(1) + '%';
      
      const pendEl = document.getElementById('dashChatPendientes'); 
      if (pendEl) pendEl.textContent = stats.preguntasSinRespuesta || 0;

      // Actividad
      renderActividadDashboard(stats.actividadUltimos7Dias || []);

      // Preguntas pendientes
      renderPendientesDashboard(stats.preguntasPendientes || [], stats.preguntasSinRespuesta || 0);
    }

  } catch (e) {
    console.warn('Metrics failed', e);
  }

  // ═══════════════════════════════════════════════════════
  // VERIFICAR ESTADO DEL SISTEMA (REAL)
  // ═══════════════════════════════════════════════════════
  verificarEstadoSistema();

  // Botón de refresh
  document.getElementById('refreshStatusBtn')?.addEventListener('click', verificarEstadoSistema);
}

// ═══════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════

function renderActividadDashboard(actividad) {
  const target = document.getElementById('dashActividad');
  if (!target) return;

  if (!actividad || actividad.length === 0) {
    target.innerHTML = '<p class="text-center text-muted py-4">No hay datos de actividad recientes.</p>';
    return;
  }

  const max = Math.max(...actividad.map(a => a.mensajes), 1);

  target.innerHTML = actividad.map(a => {
    const fecha = a.dia.split('-').reverse().slice(0, 2).join('/');
    const porcentaje = Math.max((a.mensajes * 100 / max), 5);
    return `
      <div class="dash-actividad-row">
        <div class="dash-actividad-fecha">${fecha}</div>
        <div class="dash-actividad-bar-wrap">
          <div class="dash-actividad-bar" style="width: ${porcentaje}%;">
            <span>${a.mensajes}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPendientesDashboard(pendientes, total) {
  const target = document.getElementById('dashPendientes');
  const badge = document.getElementById('dashPendientesBadge');
  if (!target) return;

  if (badge) badge.textContent = total;

  if (!pendientes || pendientes.length === 0) {
    target.innerHTML = `
      <div class="text-center py-4">
        <i class="fa-solid fa-check-circle fa-2x text-success mb-2"></i>
        <p class="text-muted small mb-0">¡No hay preguntas pendientes!</p>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="list-pendientes">
      ${pendientes.slice(0, 5).map(p => `
        <div class="pendiente-item">
          <div class="pendiente-pregunta">"${p.pregunta}"</div>
          <div class="pendiente-fecha">${p.fecha}</div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-admin-outline btn-sm w-100 mt-3" onclick="document.querySelector('[data-route=estadisticas-chatbot]').click()">
      Ver todas las ${total} preguntas
    </button>
  `;
}

async function verificarEstadoSistema() {
  const setStatus = (id, ok, texto) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (ok) {
      el.className = 'status-pill active';
      el.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>${texto}`;
    } else {
      el.className = 'status-pill';
      el.style.background = '#fee2e2';
      el.style.color = '#dc2626';
      el.innerHTML = `<i class="fa-solid fa-circle-xmark me-1"></i>${texto}`;
    }
  };

  const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  // 1. Servidor API (usando endpoint público)
  try {
    const start = Date.now();
    const res = await fetch(`${API_BASE_HOST}/api/public/configuracion`, { 
      method: 'GET',
      cache: 'no-cache'
    });
    const time = Date.now() - start;
    
    if (res.ok) {
      setStatus('statusApi', true, `OK (${time}ms)`);
    } else {
      setStatus('statusApi', false, `HTTP ${res.status}`);
    }
    
    const timeEl = document.getElementById('statusApiTime');
    if (timeEl) timeEl.textContent = `Verificado a las ${now}`;
  } catch (e) {
    setStatus('statusApi', false, 'Sin conexión');
  }

  // 2. Base de Datos
  try {
    const users = await apiFetch('/admin/usuarios');
    setStatus('statusDb', true, 'Conectada');
    const infoEl = document.getElementById('statusDbInfo');
    if (infoEl) infoEl.textContent = `${users.length} usuarios registrados`;
  } catch (e) {
    setStatus('statusDb', false, 'Error');
  }

  // 3. Motor de Chatbot
  try {
    const intents = await apiFetch('/admin/chatbot/intenciones');
    setStatus('statusChat', true, 'Activo');
    const infoEl = document.getElementById('statusChatInfo');
    if (infoEl) infoEl.textContent = `${intents.length} intenciones activas`;
  } catch (e) {
    setStatus('statusChat', false, 'Error');
  }

  // 4. Almacenamiento
  try {
    const [galeria, documentos] = await Promise.all([
      apiFetch('/admin/galeria').catch(() => []),
      apiFetch('/admin/contenidos/documentos').catch(() => [])
    ]);
    setStatus('statusStorage', true, 'OK');
    const infoEl = document.getElementById('statusStorageInfo');
    if (infoEl) infoEl.textContent = `${galeria.length} imágenes + ${documentos.length} PDFs`;
  } catch (e) {
    setStatus('statusStorage', false, 'Error');
  }
}



  // ---------- MI PERFIL ----------
  async function renderPerfil() {
  pageTitle.textContent = 'Mi Perfil';
  viewContainer.innerHTML = `
    <div class="admin-section">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 class="section-title mb-1">
            <i class="fa-solid fa-user-circle me-2 text-danger"></i>Mi Perfil
          </h3>
          <p class="text-muted small mb-0">Administra tu información personal, foto y contraseña.</p>
        </div>
      </div>

      <div class="row g-4">

        <!-- FOTO DE PERFIL -->
        <div class="col-12">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title">
                <i class="fa-solid fa-camera me-2 text-danger"></i>Foto de Perfil
              </h2>
            </div>
            <div class="card-admin-body">
              <div class="row align-items-center g-4">
                <div class="col-auto">
                  <div class="perfil-avatar-wrapper">
                    <img id="perfilAvatarPreview" src="" alt="Foto de perfil" class="perfil-avatar-img" style="display:none;"/>
                    <div id="perfilAvatarPlaceholder" class="perfil-avatar-placeholder">
                      <i class="fa-solid fa-user-shield"></i>
                    </div>
                  </div>
                </div>
                <div class="col">
                  <input type="file" id="perfilFotoInput" accept="image/*" style="display:none;"/>
                  <div class="d-flex gap-2 flex-wrap">
                    <button type="button" id="perfilSubirFotoBtn" class="btn btn-admin-primary">
                      <i class="fa-solid fa-upload me-1"></i> Subir Foto
                    </button>
                    <button type="button" id="perfilEliminarFotoBtn" class="btn btn-admin-outline d-none">
                      <i class="fa-solid fa-trash me-1"></i> Eliminar Foto
                    </button>
                  </div>
                  <small class="text-muted d-block mt-2">
                    <i class="fa-solid fa-info-circle me-1"></i>
                    JPG, PNG, WEBP. Máximo 2MB. Opcional.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN PERSONAL -->
        <div class="col-lg-6">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title">
                <i class="fa-solid fa-id-card me-2 text-danger"></i>Información Personal
              </h2>
            </div>
            <div class="card-admin-body">
              <div id="perfilLoading" class="text-center py-4">
                <div class="spinner-border text-danger" role="status"></div>
                <p class="text-muted mt-2 small">Cargando perfil...</p>
              </div>

              <form id="perfilForm" class="d-none">
                <div class="form-row mb-3">
                  <label class="fw-semibold">Nombre de usuario</label>
                  <input id="perfil_username" class="form-control" disabled/>
                  <small class="text-muted">El nombre de usuario no se puede cambiar</small>
                </div>
                <div class="form-row mb-3">
                  <label class="fw-semibold">Nombre *</label>
                  <input id="perfil_nombre" class="form-control" placeholder="Ej: Juan"/>
                </div>
                <div class="form-row mb-3">
                  <label class="fw-semibold">Apellido</label>
                  <input id="perfil_apellido" class="form-control" placeholder="Ej: Pérez"/>
                </div>
                <div class="form-row mb-3">
                  <label class="fw-semibold">Correo electrónico *</label>
                  <input id="perfil_correo" type="email" class="form-control" placeholder="correo@ejemplo.com"/>
                </div>
                <button type="submit" class="btn btn-admin-primary">
                  <i class="fa-solid fa-save me-1"></i> Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- CAMBIAR CONTRASEÑA -->
        <div class="col-lg-6">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title">
                <i class="fa-solid fa-lock me-2 text-danger"></i>Cambiar Contraseña
              </h2>
            </div>
            <div class="card-admin-body">
              <!-- Guía de contraseña -->
              <div class="password-guide mb-3">
                <div class="password-guide-title">
                  <i class="fa-solid fa-shield-halved me-1"></i>
                  Requisitos de seguridad:
                </div>
                <ul class="password-requirements">
                  <li id="req-length"><i class="fa-solid fa-circle-xmark"></i> Mínimo 8 caracteres</li>
                  <li id="req-upper"><i class="fa-solid fa-circle-xmark"></i> Al menos una mayúscula (A-Z)</li>
                  <li id="req-lower"><i class="fa-solid fa-circle-xmark"></i> Al menos una minúscula (a-z)</li>
                  <li id="req-number"><i class="fa-solid fa-circle-xmark"></i> Al menos un número (0-9)</li>
                  <li id="req-special"><i class="fa-solid fa-circle-xmark"></i> Al menos un símbolo (!@#$%)</li>
                </ul>
                <div class="password-example">
                  <strong>Ejemplo seguro:</strong> <code>MiClave2026!</code> o <code>Colegio#Seguro24</code>
                </div>
              </div>

              <form id="passwordForm">
                <div class="form-row mb-3">
                  <label class="fw-semibold">Contraseña actual *</label>
                  <div class="input-group">
                    <input id="pwd_actual" type="password" class="form-control" placeholder="••••••••"/>
                    <button type="button" class="btn btn-outline-secondary toggle-pwd" data-target="pwd_actual">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div class="form-row mb-3">
                  <label class="fw-semibold">Nueva contraseña *</label>
                  <div class="input-group">
                    <input id="pwd_nueva" type="password" class="form-control" placeholder="Mínimo 8 caracteres con símbolos"/>
                    <button type="button" class="btn btn-outline-secondary toggle-pwd" data-target="pwd_nueva">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div class="form-row mb-3">
                  <label class="fw-semibold">Confirmar nueva contraseña *</label>
                  <div class="input-group">
                    <input id="pwd_confirmar" type="password" class="form-control" placeholder="Repite la contraseña"/>
                    <button type="button" class="btn btn-outline-secondary toggle-pwd" data-target="pwd_confirmar">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </div>
                </div>
                <div id="passwordStatus" class="alert d-none mb-3"></div>
                <button type="submit" class="btn btn-admin-primary">
                  <i class="fa-solid fa-key me-1"></i> Cambiar Contraseña
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- INFO DE LA CUENTA -->
        <div class="col-12">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title">
                <i class="fa-solid fa-circle-info me-2 text-danger"></i>Información de la Cuenta
              </h2>
            </div>
            <div class="card-admin-body">
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="perfil-info-item">
                    <div class="perfil-info-icon">
                      <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                      <div class="perfil-info-label">Rol</div>
                      <div class="perfil-info-value">Administrador</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="perfil-info-item">
                    <div class="perfil-info-icon">
                      <i class="fa-solid fa-user"></i>
                    </div>
                    <div>
                      <div class="perfil-info-label">ID de Usuario</div>
                      <div class="perfil-info-value" id="perfil_id">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="perfil-info-item">
                    <div class="perfil-info-icon">
                      <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                      <div class="perfil-info-label">Email</div>
                      <div class="perfil-info-value" id="perfil_email_info">-</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ═══════════════════════════════════════════════════════
  // CARGAR PERFIL
  // ═══════════════════════════════════════════════════════
  try {
    const perfil = await apiFetch('/admin/perfil');
    
    document.getElementById('perfilLoading').classList.add('d-none');
    document.getElementById('perfilForm').classList.remove('d-none');
    
    document.getElementById('perfil_username').value = perfil.username || '';
    document.getElementById('perfil_nombre').value = perfil.nombre || '';
    document.getElementById('perfil_apellido').value = perfil.apellido || '';
    document.getElementById('perfil_correo').value = perfil.correo || '';
    
    document.getElementById('perfil_id').textContent = '#' + (perfil.id || '-');
    document.getElementById('perfil_email_info').textContent = perfil.correo || '-';
    
    // Cargar avatar
    actualizarAvatar(perfil.fotoPerfil);
    
  } catch (err) {
    document.getElementById('perfilLoading').innerHTML = `
      <div class="alert alert-danger">Error al cargar perfil: ${err.message}</div>
    `;
    return;
  }

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR AVATAR
  // ═══════════════════════════════════════════════════════
  function actualizarAvatar(rutaFoto) {
    const preview = document.getElementById('perfilAvatarPreview');
    const placeholder = document.getElementById('perfilAvatarPlaceholder');
    const btnEliminar = document.getElementById('perfilEliminarFotoBtn');
    
    if (!preview || !placeholder) return;
    
    if (rutaFoto) {
      let src = rutaFoto;
      if (!src.startsWith('/') && !src.startsWith('http')) {
        src = '/' + src;
      }
      
      preview.src = src + '?t=' + Date.now();
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      if (btnEliminar) btnEliminar.classList.remove('d-none');
      
      // Actualizar avatar del topbar
      const topbarAvatar = document.querySelector('.user-avatar');
      if (topbarAvatar) {
        topbarAvatar.innerHTML = `<img src="${src}" alt="Perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
      }
    } else {
      preview.style.display = 'none';
      placeholder.style.display = 'flex';
      if (btnEliminar) btnEliminar.classList.add('d-none');
      
      // Resetear avatar del topbar
      const topbarAvatar = document.querySelector('.user-avatar');
      if (topbarAvatar) {
        topbarAvatar.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // FOTO DE PERFIL - LISTENERS
  // ═══════════════════════════════════════════════════════
  const fotoInput = document.getElementById('perfilFotoInput');
  const subirFotoBtn = document.getElementById('perfilSubirFotoBtn');
  const eliminarFotoBtn = document.getElementById('perfilEliminarFotoBtn');
  
  if (subirFotoBtn && fotoInput) {
    subirFotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fotoInput.click();
    });
  }
  
  if (fotoInput) {
    fotoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('❌ Debes seleccionar una imagen');
        return;
      }
      
      // Validar tamaño (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ La imagen no debe superar 2MB');
        return;
      }
      
      // Preview local
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('perfilAvatarPreview');
        preview.src = ev.target.result;
        preview.style.display = 'block';
        document.getElementById('perfilAvatarPlaceholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
      
      // Subir al servidor
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await apiFetch('/admin/perfil/foto', {
          method: 'POST',
          body: formData
        });
        
        showToast('✅ Foto de perfil actualizada');
        actualizarAvatar(res.fotoPerfil);
      } catch (err) {
        alert('❌ Error al subir foto: ' + err.message);
      }
      
      // Resetear input para permitir subir la misma imagen de nuevo
      fotoInput.value = '';
    });
  }
  
  if (eliminarFotoBtn) {
    eliminarFotoBtn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar tu foto de perfil?')) return;
      
      try {
        await apiFetch('/admin/perfil/foto', { method: 'DELETE' });
        showToast('Foto eliminada');
        actualizarAvatar(null);
      } catch (err) {
        alert('❌ Error: ' + err.message);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // FORMULARIO DE INFORMACIÓN PERSONAL
  // ═══════════════════════════════════════════════════════
  const perfilForm = document.getElementById('perfilForm');
  if (perfilForm) {
    perfilForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        nombre: document.getElementById('perfil_nombre').value.trim(),
        apellido: document.getElementById('perfil_apellido').value.trim(),
        correo: document.getElementById('perfil_correo').value.trim()
      };
      
      if (!payload.nombre) return alert('El nombre es obligatorio');
      if (!payload.correo) return alert('El correo es obligatorio');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
        return alert('El correo no es válido');
      }
      
      try {
        const res = await apiFetch('/admin/perfil', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('✅ Perfil actualizado correctamente');
        
        const userNameEl = document.getElementById('currentUsername');
        if (userNameEl) {
          userNameEl.textContent = `${res.nombre} ${res.apellido || ''}`.trim();
        }
        
        document.getElementById('perfil_email_info').textContent = res.correo;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // VERIFICACIÓN DE CONTRASEÑA EN TIEMPO REAL
  // ═══════════════════════════════════════════════════════
  const pwdNueva = document.getElementById('pwd_nueva');
  
  function validarPassword(pwd) {
    return {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`;']/.test(pwd)
    };
  }
  
  function actualizarRequisitos(pwd) {
    const validaciones = validarPassword(pwd);
    const items = {
      'req-length': validaciones.length,
      'req-upper': validaciones.upper,
      'req-lower': validaciones.lower,
      'req-number': validaciones.number,
      'req-special': validaciones.special
    };
    
    Object.entries(items).forEach(([id, valido]) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const icon = el.querySelector('i');
      if (valido) {
        el.classList.add('valid');
        el.classList.remove('invalid');
        if (icon) icon.className = 'fa-solid fa-circle-check';
      } else {
        el.classList.remove('valid');
        el.classList.add('invalid');
        if (icon) icon.className = 'fa-solid fa-circle-xmark';
      }
    });
    
    return Object.values(validaciones).every(v => v);
  }
  
  // Verificar si las contraseñas coinciden en tiempo real
  function verificarCoincidencia() {
    const nueva = document.getElementById('pwd_nueva')?.value || '';
    const confirmar = document.getElementById('pwd_confirmar')?.value || '';
    const status = document.getElementById('passwordStatus');
    
    if (confirmar && nueva !== confirmar) {
      status.innerHTML = '⚠️ Las contraseñas <strong>no coinciden</strong>';
      status.className = 'alert alert-warning mb-3';
      status.classList.remove('d-none');
    } else if (confirmar && nueva === confirmar) {
      status.classList.add('d-none');
    }
  }
  
  // Validar en tiempo real MIENTRAS se escribe en "Nueva contraseña"
  if (pwdNueva) {
    pwdNueva.addEventListener('input', (e) => {
      actualizarRequisitos(e.target.value);
      verificarCoincidencia();
      // Limpiar mensaje de error previo
      const status = document.getElementById('passwordStatus');
      if (status && status.classList.contains('alert-danger')) {
        status.classList.add('d-none');
      }
    });
  }
  
  // También validar cuando se escribe en "Confirmar" (por si el usuario escribe ahí primero)
  const pwdConfirmar = document.getElementById('pwd_confirmar');
  if (pwdConfirmar) {
    pwdConfirmar.addEventListener('input', (e) => {
      const nueva = document.getElementById('pwd_nueva').value;
      if (nueva) {
        actualizarRequisitos(nueva);
      }
      verificarCoincidencia();
    });
  }

  // ═══════════════════════════════════════════════════════
  // FORMULARIO DE CAMBIO DE CONTRASEÑA
  // ═══════════════════════════════════════════════════════
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const actual = document.getElementById('pwd_actual').value;
      const nueva = document.getElementById('pwd_nueva').value;
      const confirmar = document.getElementById('pwd_confirmar').value;
      const status = document.getElementById('passwordStatus');
      
      status.classList.add('d-none');
      
      // Validaciones
      if (!actual || !nueva || !confirmar) {
        status.textContent = '⚠️ Todos los campos son obligatorios';
        status.className = 'alert alert-warning mb-3';
        status.classList.remove('d-none');
        return;
      }
      
      // Validar requisitos de seguridad
      const validaciones = validarPassword(nueva);
      const faltantes = [];
      if (!validaciones.length) faltantes.push('mínimo 8 caracteres');
      if (!validaciones.upper) faltantes.push('una mayúscula');
      if (!validaciones.lower) faltantes.push('una minúscula');
      if (!validaciones.number) faltantes.push('un número');
      if (!validaciones.special) faltantes.push('un símbolo (!@#$%)');
      
      if (faltantes.length > 0) {
        status.innerHTML = `⚠️ La contraseña debe incluir: <strong>${faltantes.join(', ')}</strong>`;
        status.className = 'alert alert-warning mb-3';
        status.classList.remove('d-none');
        return;
      }
      
      if (nueva !== confirmar) {
        status.innerHTML = '⚠️ Las contraseñas <strong>no coinciden</strong>';
        status.className = 'alert alert-warning mb-3';
        status.classList.remove('d-none');
        return;
      }
      
      if (nueva === actual) {
        status.innerHTML = '⚠️ La nueva contraseña debe ser <strong>diferente</strong> a la actual';
        status.className = 'alert alert-warning mb-3';
        status.classList.remove('d-none');
        return;
      }
      
      try {
        await apiFetch('/admin/perfil/cambiar-password', {
          method: 'POST',
          body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
        });
        
        status.textContent = '✅ Contraseña actualizada correctamente';
        status.className = 'alert alert-success mb-3';
        status.classList.remove('d-none');
        
        passwordForm.reset();
        actualizarRequisitos('');
        
        setTimeout(() => status.classList.add('d-none'), 5000);
      } catch (err) {
        status.textContent = '❌ ' + (err.message || 'Error al cambiar contraseña');
        status.className = 'alert alert-danger mb-3';
        status.classList.remove('d-none');
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // TOGGLE VISIBILIDAD DE CONTRASEÑAS
  // ═══════════════════════════════════════════════════════
  document.querySelectorAll('.toggle-pwd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      
      if (!input || !icon) return;
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });
  });
}



  // ---------- USUARIOS ----------
  async function renderUsuarios() {
    pageTitle.textContent = 'Gestión de Usuarios';
    viewContainer.innerHTML = `
      <div class="card-admin">
        <div class="card-admin-header">
          <div class="search-filter-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="userSearch" class="form-control" placeholder="Buscar usuarios por nombre, correo o rol...">
          </div>
          <button id="crearUsuarioBtn" class="btn btn-admin-primary">
            <i class="fa-solid fa-plus me-1"></i> Nuevo Usuario
          </button>
        </div>
        <div class="card-admin-body p-0">
          <div id="usuariosTableContainer" class="table-admin-wrap">
            <div class="text-center py-4 text-muted">Cargando usuarios...</div>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('usuariosTableContainer');
    const searchInput = document.getElementById('userSearch');

    let allUsuarios = [];

    const drawTable = (list) => {
      if (!list.length) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No se encontraron usuarios.</div>`;
        return;
      }

      container.innerHTML = `
        <table class="table-admin">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Correo</th>
              <th>Roles</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(u => `
              <tr>
                <td><strong>#${u.id}</strong></td>
                <td><span class="fw-semibold">${u.username || u.correo}</span></td>
                <td>${u.nombre || ''} ${u.apellido || ''}</td>
                <td>${u.correo}</td>
                <td>
                  ${(u.roles || []).map(r => `<span class="badge bg-secondary me-1">${r}</span>`).join('')}
                </td>
                <td>
                  <span class="status-pill ${u.activo ? 'active' : 'inactive'}">
                    ${u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td class="text-end">
                  <button data-id="${u.id}" class="btn btn-admin-outline btn-sm me-1 btn-edit-user">
                    <i class="fa-solid fa-pen me-1"></i> Editar
                  </button>
                  <button data-id="${u.id}" class="btn btn-admin-danger-outline btn-sm btn-delete-user">
                    <i class="fa-solid fa-user-xmark me-1"></i> Desactivar
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.btn-edit-user').forEach(b => {
        b.addEventListener('click', () => editUserModal(b.dataset.id));
      });

      container.querySelectorAll('.btn-delete-user').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('¿Deseas desactivar este usuario?')) {
            try {
              await apiFetch(`/admin/usuarios/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Usuario desactivado');
              renderUsuarios();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      });
    };

    try {
      allUsuarios = await apiFetch('/admin/usuarios');
      drawTable(allUsuarios);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger m-3">${err.message}</div>`;
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = allUsuarios.filter(u =>
          (u.username || '').toLowerCase().includes(query) ||
          (u.nombre || '').toLowerCase().includes(query) ||
          (u.apellido || '').toLowerCase().includes(query) ||
          (u.correo || '').toLowerCase().includes(query)
        );
        drawTable(filtered);
      });
    }

    document.getElementById('crearUsuarioBtn').addEventListener('click', () => {
      const html = `
        <h3><i class="fa-solid fa-user-plus me-2 text-danger"></i>Crear Nuevo Usuario</h3>
        <div class="form-row"><label class="fw-semibold">Username</label><input id="m_username" class="form-control" placeholder="ej: jperez"/></div>
        <div class="form-row"><label class="fw-semibold">Nombre</label><input id="m_nombre" class="form-control" placeholder="Juan"/></div>
        <div class="form-row"><label class="fw-semibold">Apellido</label><input id="m_apellido" class="form-control" placeholder="Pérez"/></div>
        <div class="form-row"><label class="fw-semibold">Correo</label><input id="m_correo" type="email" class="form-control" placeholder="correo@ejemplo.com"/></div>
        <div class="form-row"><label class="fw-semibold">Contraseña</label><input id="m_password" type="password" class="form-control" placeholder="Mínimo 6 caracteres"/></div>
        <div class="form-row"><label class="fw-semibold">Rol Inicial</label><select id="m_rol" class="form-select"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>
        <div class="modal-actions">
          <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
          <button id="m_submit" class="btn btn-admin-primary">Crear Usuario</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#m_submit').addEventListener('click', async () => {
        const username = overlay.querySelector('#m_username').value.trim();
        const nombre = overlay.querySelector('#m_nombre').value.trim();
        const apellido = overlay.querySelector('#m_apellido').value.trim();
        const correo = overlay.querySelector('#m_correo').value.trim();
        const password = overlay.querySelector('#m_password').value;
        const rol = overlay.querySelector('#m_rol').value;

        if (!username || !nombre || !correo || !password) {
          alert('Por favor completa los campos requeridos.');
          return;
        }

        try {
          await apiFetch('/admin/usuarios/registrar', {
            method: 'POST',
            body: JSON.stringify({ username, nombre, apellido, correo, password, rol })
          });
          closeModal(overlay);
          showToast('Usuario creado con éxito');
          renderUsuarios();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    });

    async function editUserModal(id) {
      try {
        const user = await apiFetch(`/admin/usuarios/${id}`);
        const html = `
          <h3><i class="fa-solid fa-pen me-2 text-danger"></i>Editar Usuario #${user.id}</h3>
          <div class="form-row"><label class="fw-semibold">Nombre</label><input id="m_nombre" class="form-control" value="${user.nombre || ''}"/></div>
          <div class="form-row"><label class="fw-semibold">Apellido</label><input id="m_apellido" class="form-control" value="${user.apellido || ''}"/></div>
          <div class="form-row"><label class="fw-semibold">Correo</label><input id="m_correo" class="form-control" value="${user.correo || ''}"/></div>
          <div class="form-row"><label class="fw-semibold">Nueva Contraseña (opcional)</label><input id="m_password" type="password" class="form-control" placeholder="Dejar vacío para no cambiar"/></div>
          <div class="form-row"><label class="fw-semibold">Roles (separar por comas)</label><input id="m_roles" class="form-control" value="${(user.roles || []).join(', ')}"/></div>
          <div class="modal-actions">
            <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
            <button id="m_submit" class="btn btn-admin-primary">Guardar Cambios</button>
          </div>
        `;
        const overlay = showModal(html);
        overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
        overlay.querySelector('#m_submit').addEventListener('click', async () => {
          const nombre = overlay.querySelector('#m_nombre').value.trim();
          const apellido = overlay.querySelector('#m_apellido').value.trim();
          const correo = overlay.querySelector('#m_correo').value.trim();
          const password = overlay.querySelector('#m_password').value || null;

          try {
            await apiFetch(`/admin/usuarios/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ nombre, apellido, correo, password })
            });

            const rolesRaw = overlay.querySelector('#m_roles').value || '';
            const roles = rolesRaw.split(',').map(s => s.trim()).filter(Boolean);
            for (const r of roles) {
              await apiFetch(`/admin/usuarios/${id}/roles?rol=${encodeURIComponent(r)}`, { method: 'PATCH' });
            }

            closeModal(overlay);
            showToast('Usuario actualizado con éxito');
            renderUsuarios();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        });
      } catch (err) {
        alert('Error cargando usuario: ' + err.message);
      }
    }
  }

  // ---------- CONTENIDOS ----------
  async function renderContenidos() {
    pageTitle.textContent = 'Gestión de Contenidos';
    viewContainer.innerHTML = `
      <div class="card-admin">
        <div class="admin-tab-nav">
          <button id="tabNoticias" class="admin-tab-btn active"><i class="fa-solid fa-newspaper me-2"></i>Noticias</button>
          <button id="tabEventos" class="admin-tab-btn"><i class="fa-solid fa-calendar-days me-2"></i>Eventos</button>
          <button id="tabDocumentos" class="admin-tab-btn"><i class="fa-solid fa-file-pdf me-2"></i>Documentos</button>
        </div>
        <div class="card-admin-body">
          <div id="contenidosInner">Cargando noticias...</div>
        </div>
      </div>
    `;

    const inner = document.getElementById('contenidosInner');
    const tabNoticias = document.getElementById('tabNoticias');
    const tabEventos = document.getElementById('tabEventos');
    const tabDocumentos = document.getElementById('tabDocumentos');

    const setTab = (activeBtn) => {
      [tabNoticias, tabEventos, tabDocumentos].forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    };

    const loadNoticias = async () => {
      setTab(tabNoticias);
      inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando noticias...</div>';
      try {
        const noticias = await apiFetch('/admin/contenidos/noticias');
        inner.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h6 mb-0 fw-bold">Publicación de Noticias</h3>
            <button id="crearNoticiaBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Crear Noticia</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead><tr><th>ID</th><th>Título</th><th>Resumen</th><th class="text-end">Acciones</th></tr></thead>
              <tbody>
                ${noticias.map(n => `
                  <tr>
                    <td>#${n.id}</td>
                    <td><strong>${n.titulo}</strong></td>
                    <td>${n.resumen || ''}</td>
                    <td class="text-end">
                      <button data-id="${n.id}" class="btn btn-admin-outline btn-sm me-1 btn-edit-not">Editar</button>
                      <button data-id="${n.id}" class="btn btn-admin-danger-outline btn-sm btn-delete-not">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

        document.getElementById('crearNoticiaBtn').addEventListener('click', () => {
          const html = `
            <h3>Crear Noticia</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control"/></div>
            <div class="form-row"><label>Contenido</label><textarea id="m_contenido" class="form-control" rows="4"></textarea></div>
            <div class="form-row"><label>Resumen</label><input id="m_resumen" class="form-control"/></div>
            <div class="modal-actions">
              <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
              <button id="m_submit" class="btn btn-admin-primary">Publicar</button>
            </div>
          `;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async () => {
            const titulo = overlay.querySelector('#m_titulo').value.trim();
            const contenido = overlay.querySelector('#m_contenido').value.trim();
            const resumen = overlay.querySelector('#m_resumen').value.trim();
            if (!titulo) return alert('Título requerido');
            try {
              await apiFetch('/admin/contenidos/noticias', {
                method: 'POST',
                body: JSON.stringify({ titulo, contenido, resumen, estado: 'publicado' })
              });
              closeModal(overlay);
              showToast('Noticia creada');
              loadNoticias();
            } catch (err) { alert(err.message); }
          });
        });

        inner.querySelectorAll('.btn-edit-not').forEach(b => {
          b.addEventListener('click', () => {
            const n = noticias.find(x => x.id == b.dataset.id);
            const html = `
              <h3>Editar Noticia #${n.id}</h3>
              <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control" value="${n.titulo || ''}"/></div>
              <div class="form-row"><label>Contenido</label><textarea id="m_contenido" class="form-control" rows="4">${n.contenido || ''}</textarea></div>
              <div class="form-row"><label>Resumen</label><input id="m_resumen" class="form-control" value="${n.resumen || ''}"/></div>
              <div class="modal-actions">
                <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
                <button id="m_submit" class="btn btn-admin-primary">Guardar</button>
              </div>
            `;
            const overlay = showModal(html);
            overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
            overlay.querySelector('#m_submit').addEventListener('click', async () => {
              const titulo = overlay.querySelector('#m_titulo').value.trim();
              const contenido = overlay.querySelector('#m_contenido').value.trim();
              const resumen = overlay.querySelector('#m_resumen').value.trim();
              try {
                await apiFetch(`/admin/contenidos/noticias/${n.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ titulo, contenido, resumen, estado: n.estado })
                });
                closeModal(overlay);
                showToast('Noticia actualizada');
                loadNoticias();
              } catch (err) { alert(err.message); }
            });
          });
        });

        inner.querySelectorAll('.btn-delete-not').forEach(b => {
          b.addEventListener('click', async () => {
            if (confirm('¿Eliminar esta noticia?')) {
              await apiFetch(`/admin/contenidos/noticias/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Noticia eliminada');
              loadNoticias();
            }
          });
        });

      } catch (err) { inner.innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
    };

    const loadEventos = async () => {
      setTab(tabEventos);
      inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando eventos...</div>';
      try {
        const eventos = await apiFetch('/admin/contenidos/eventos');
        inner.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h6 mb-0 fw-bold">Gestión de Eventos</h3>
            <button id="crearEventoBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Crear Evento</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Fecha</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${eventos.map(e => `
                  <tr>
                    <td>#${e.id}</td>
                    <td><strong>${e.titulo}</strong></td>
                    <td>${e.fecha || ''}</td>
                    <td class="text-end">
                      <button data-id="${e.id}" class="btn btn-admin-outline btn-sm me-1 btn-edit-ev">Editar</button>
                      <button data-id="${e.id}" class="btn btn-admin-danger-outline btn-sm btn-delete-ev">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        document.getElementById('crearEventoBtn').addEventListener('click', () => {
          const html = `
            <h3>Crear Evento</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control"/></div>
            <div class="form-row"><label>Fecha</label><input id="m_fecha" type="date" class="form-control"/></div>
            <div class="form-row"><label>Descripción</label><textarea id="m_desc" class="form-control" rows="4"></textarea></div>
            <div class="modal-actions">
              <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
              <button id="m_submit" class="btn btn-admin-primary">Crear</button>
            </div>
          `;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async () => {
            const titulo = overlay.querySelector('#m_titulo').value.trim();
            const fecha = overlay.querySelector('#m_fecha').value;
            const descripcion = overlay.querySelector('#m_desc').value.trim();
            if (!titulo) return alert('Título requerido');
            try {
              await apiFetch('/admin/contenidos/eventos', { method: 'POST', body: JSON.stringify({ titulo, fecha, descripcion }) });
              closeModal(overlay);
              showToast('Evento creado');
              loadEventos();
            } catch (err) { alert(err.message); }
          });
        });
        inner.querySelectorAll('.btn-edit-ev').forEach(b => {
          b.addEventListener('click', () => {
            const ev = eventos.find(x => x.id == b.dataset.id);
            const html = `
              <h3>Editar Evento #${ev.id}</h3>
              <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control" value="${ev.titulo || ''}"/></div>
              <div class="form-row"><label>Fecha</label><input id="m_fecha" type="date" class="form-control" value="${ev.fecha || ''}"/></div>
              <div class="form-row"><label>Descripción</label><textarea id="m_desc" class="form-control" rows="4">${ev.descripcion || ''}</textarea></div>
              <div class="modal-actions">
                <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
                <button id="m_submit" class="btn btn-admin-primary">Guardar</button>
              </div>
            `;
            const overlay = showModal(html);
            overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
            overlay.querySelector('#m_submit').addEventListener('click', async () => {
              const titulo = overlay.querySelector('#m_titulo').value.trim();
              const fecha = overlay.querySelector('#m_fecha').value;
              const descripcion = overlay.querySelector('#m_desc').value.trim();
              if (!titulo) return alert('Título requerido');
              try {
                await apiFetch(`/admin/contenidos/eventos/${ev.id}`, { method: 'PUT', body: JSON.stringify({ titulo, fecha, descripcion }) });
                closeModal(overlay);
                showToast('Evento actualizado');
                loadEventos();
              } catch (err) { alert(err.message); }
            });
          });
        });
        inner.querySelectorAll('.btn-delete-ev').forEach(b => {
          b.addEventListener('click', async () => {
            if (confirm('¿Eliminar este evento?')) {
              await apiFetch(`/admin/contenidos/eventos/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Evento eliminado');
              loadEventos();
            }
          });
        });
      } catch (err) {
        inner.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    const loadDocumentos = async () => {
      setTab(tabDocumentos);
      inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando documentos...</div>';
      try {
        const docs = await apiFetch('/admin/contenidos/documentos');
        inner.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h6 mb-0 fw-bold">Gestión de Documentos</h3>
            <button id="crearDocBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-upload me-1"></i> Subir Documento</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Archivo</th>
                  <th>Fecha</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${docs.map(d => `
                  <tr>
                    <td>#${d.id}</td>
                    <td>
                      <strong>${d.titulo}</strong>
                      ${d.descripcion ? `<br><small class="text-muted">${d.descripcion}</small>` : ''}
                    </td>
                    <td><span class="badge bg-secondary">${d.tipo || 'General'}</span></td>
                    <td>
                      ${d.rutaArchivo ? `
                        <a href="${d.rutaArchivo}" target="_blank" class="text-decoration-none">
                          <i class="fa-solid fa-file-pdf text-danger me-1"></i>
                          ${d.nombreArchivo || 'Ver PDF'}
                        </a>
                      ` : '<span class="text-muted">—</span>'}
                    </td>
                    <td>${d.fechaPublicacion ? new Date(d.fechaPublicacion).toLocaleDateString('es-CO') : '-'}</td>
                    <td class="text-end">
                      <button data-id="${d.id}" class="btn btn-admin-outline btn-sm me-1 btn-edit-doc">Editar</button>
                      <button data-id="${d.id}" class="btn btn-admin-danger-outline btn-sm btn-delete-doc">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

        // Botón "Subir Documento"
        document.getElementById('crearDocBtn').addEventListener('click', () => {
          const html = `
            <h3 class="h5 fw-bold mb-3">Subir Documento PDF</h3>
            <div class="form-row mb-3">
              <label class="form-label">Título *</label>
              <input id="m_titulo" class="form-control" placeholder="Ej: Manual de convivencia 2026"/>
            </div>
            <div class="form-row mb-3">
              <label class="form-label">Descripción</label>
              <textarea id="m_descripcion" class="form-control" rows="2" placeholder="Descripción breve del documento"></textarea>
            </div>
            <div class="form-row mb-3">
              <label class="form-label">Tipo</label>
              <select id="m_tipo" class="form-control">
                <option value="Manual">Manual</option>
                <option value="Circular">Circular</option>
                <option value="Formato">Formato</option>
                <option value="PEI">PEI</option>
                <option value="General" selected>General</option>
              </select>
            </div>
            <div class="form-row mb-3">
              <label class="form-label">Archivo PDF *</label>
              <input id="m_file" type="file" class="form-control" accept=".pdf,application/pdf"/>
              <small class="text-muted">Tamaño máximo: 10MB</small>
            </div>
            <div class="modal-actions">
              <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
              <button id="m_submit" class="btn btn-admin-primary"><i class="fa-solid fa-upload me-1"></i> Subir</button>
            </div>
          `;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async () => {
            const titulo = overlay.querySelector('#m_titulo').value.trim();
            const descripcion = overlay.querySelector('#m_descripcion').value.trim();
            const tipo = overlay.querySelector('#m_tipo').value;
            const file = overlay.querySelector('#m_file').files[0];

            if (!titulo) return alert('El título es obligatorio');
            if (!file) return alert('Debes seleccionar un archivo PDF');
            if (file.type !== 'application/pdf') return alert('El archivo debe ser un PDF');

            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('tipo', tipo);
            formData.append('file', file);

            try {
              await apiFetch('/admin/contenidos/documentos/upload', {
                method: 'POST',
                body: formData
              });
              closeModal(overlay);
              showToast('Documento subido correctamente');
              loadDocumentos();
            } catch (err) {
              alert('Error al subir: ' + err.message);
            }
          });
        });

        // Botones editar
        inner.querySelectorAll('.btn-edit-doc').forEach(b => {
          b.addEventListener('click', () => {
            const doc = docs.find(x => x.id == b.dataset.id);
            const html = `
              <h3 class="h5 fw-bold mb-3">Editar Documento #${doc.id}</h3>
              <div class="form-row mb-3">
                <label class="form-label">Título *</label>
                <input id="m_titulo" class="form-control" value="${doc.titulo || ''}"/>
              </div>
              <div class="form-row mb-3">
                <label class="form-label">Descripción</label>
                <textarea id="m_descripcion" class="form-control" rows="2">${doc.descripcion || ''}</textarea>
              </div>
              <div class="form-row mb-3">
                <label class="form-label">Tipo</label>
                <select id="m_tipo" class="form-control">
                  <option value="Manual" ${doc.tipo === 'Manual' ? 'selected' : ''}>Manual</option>
                  <option value="Circular" ${doc.tipo === 'Circular' ? 'selected' : ''}>Circular</option>
                  <option value="Formato" ${doc.tipo === 'Formato' ? 'selected' : ''}>Formato</option>
                  <option value="PEI" ${doc.tipo === 'PEI' ? 'selected' : ''}>PEI</option>
                  <option value="General" ${doc.tipo === 'General' || !doc.tipo ? 'selected' : ''}>General</option>
                </select>
              </div>
              <div class="form-row mb-3">
                <label class="form-label">Reemplazar archivo (opcional)</label>
                <input id="m_file" type="file" class="form-control" accept=".pdf,application/pdf"/>
                <small class="text-muted">Actual: ${doc.nombreArchivo || 'sin archivo'}</small>
              </div>
              <div class="modal-actions">
                <button id="m_cancel" class="btn btn-admin-outline">Cancelar</button>
                <button id="m_submit" class="btn btn-admin-primary">Guardar</button>
              </div>
            `;
            const overlay = showModal(html);
            overlay.querySelector('#m_cancel').addEventListener('click', () => closeModal(overlay));
            overlay.querySelector('#m_submit').addEventListener('click', async () => {
              const titulo = overlay.querySelector('#m_titulo').value.trim();
              const descripcion = overlay.querySelector('#m_descripcion').value.trim();
              const tipo = overlay.querySelector('#m_tipo').value;
              const file = overlay.querySelector('#m_file').files[0];

              if (!titulo) return alert('El título es obligatorio');

              const formData = new FormData();
              formData.append('titulo', titulo);
              formData.append('descripcion', descripcion);
              formData.append('tipo', tipo);
              if (file) formData.append('file', file);

              try {
                await apiFetch(`/admin/contenidos/documentos/${doc.id}/upload`, {
                  method: 'PUT',
                  body: formData
                });
                closeModal(overlay);
                showToast('Documento actualizado');
                loadDocumentos();
              } catch (err) {
                alert('Error al actualizar: ' + err.message);
              }
            });
          });
        });

        // Botones eliminar
        inner.querySelectorAll('.btn-delete-doc').forEach(b => {
          b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este documento?')) return;
            try {
              await apiFetch(`/admin/contenidos/documentos/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Documento eliminado');
              loadDocumentos();
            } catch (err) { alert(err.message); }
          });
        });
      } catch (err) {
        inner.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    tabNoticias.addEventListener('click', loadNoticias);
    tabEventos.addEventListener('click', loadEventos);
    tabDocumentos.addEventListener('click', loadDocumentos);

    loadNoticias();
  }

  // ---------- INSTITUCIONAL ----------
  // ---------- INSTITUCIONAL (Sedes, Áreas, Contactos) ----------
  async function renderInstitucional() {
    pageTitle.textContent = 'Información Institucional';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-landmark me-2 text-danger"></i>Información Institucional
            </h3>
            <p class="text-muted small mb-0">Administra las sedes, áreas de atención y canales institucionales.</p>
          </div>
        </div>

        <div class="card-admin">
          <div class="admin-tab-nav">
            <button id="tabSedes" class="admin-tab-btn active"><i class="fa-solid fa-building me-2"></i>Sedes</button>
            <button id="tabAreas" class="admin-tab-btn"><i class="fa-solid fa-diagram-project me-2"></i>Áreas</button>
            <button id="tabContactos" class="admin-tab-btn"><i class="fa-solid fa-address-book me-2"></i>Contactos</button>
          </div>
          <div class="card-admin-body" id="instContent">
            <div class="text-center py-4 text-muted">Cargando...</div>
          </div>
        </div>
      </div>
    `;

    const tabSedes = document.getElementById('tabSedes');
    const tabAreas = document.getElementById('tabAreas');
    const tabContactos = document.getElementById('tabContactos');
    const instContent = document.getElementById('instContent');

    const setTab = (active) => {
      [tabSedes, tabAreas, tabContactos].forEach(t => t.classList.remove('active'));
      active.classList.add('active');
    };

    // ==================== SEDES ====================
    const loadSedes = async () => {
      setTab(tabSedes);
      instContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando sedes...</div>';
      try {
        const sedes = await apiFetch('/admin/institucional/sedes');
        instContent.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="h6 mb-0 fw-bold">Sedes (${sedes.length})</h4>
            <button id="crearSedeBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Añadir Sede</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead>
                <tr>
                  <th style="width:50px;">#</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Jornada</th>
                  <th style="width:80px;">Activa</th>
                  <th class="text-end" style="width:140px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${sedes.map(s => `
                  <tr>
                    <td>${s.id}</td>
                    <td><strong>${s.nombre || ''}</strong><br><small class="text-muted">${s.descripcion || ''}</small></td>
                    <td>${s.direccion || ''}</td>
                    <td>${s.telefono || '—'}</td>
                    <td>${s.jornada || '—'}</td>
                    <td>${s.activa !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-primary me-2 btn-edit-sede" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-sm btn-danger btn-del-sede" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

        document.getElementById('crearSedeBtn').addEventListener('click', () => openSedeModal());
        instContent.querySelectorAll('.btn-edit-sede').forEach(b => {
          b.addEventListener('click', () => openSedeModal(parseInt(b.dataset.id, 10)));
        });
        instContent.querySelectorAll('.btn-del-sede').forEach(b => {
          b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar esta sede?')) return;
            try {
              await apiFetch(`/admin/institucional/sedes/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Sede eliminada');
              loadSedes();
            } catch (err) { alert(err.message); }
          });
        });
      } catch (err) {
        instContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    const openSedeModal = async (id = null) => {
      let sede = { nombre: '', direccion: '', telefono: '', jornada: 'Única', descripcion: '', horarioAtencion: '', activa: true };
      if (id) {
        try { sede = await apiFetch(`/admin/institucional/sedes/${id}`); }
        catch (err) { alert('Error: ' + err.message); return; }
      }
      const html = `
        <h3><i class="fa-solid fa-building me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Sede</h3>
        <div class="form-row mb-3"><label class="fw-semibold">Nombre *</label><input id="sd_nombre" class="form-control" value="${sede.nombre || ''}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Dirección *</label><input id="sd_direccion" class="form-control" value="${sede.direccion || ''}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Teléfono</label><input id="sd_telefono" class="form-control" value="${sede.telefono || ''}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Jornada</label><input id="sd_jornada" class="form-control" value="${sede.jornada || 'Única'}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Horario atención</label><input id="sd_horario" class="form-control" value="${sede.horarioAtencion || ''}" placeholder="Ej: 7:00 a.m. - 2:00 p.m."/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Descripción</label><textarea id="sd_descripcion" class="form-control" rows="2">${sede.descripcion || ''}</textarea></div>
        <div class="form-row mb-3"><label class="fw-semibold d-block"><input id="sd_activa" type="checkbox" ${sede.activa !== false ? 'checked' : ''}/> Activa</label></div>
        <div class="modal-actions">
          <button id="sd_cancel" class="btn btn-admin-outline">Cancelar</button>
          <button id="sd_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#sd_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#sd_submit').addEventListener('click', async () => {
        const payload = {
          nombre: overlay.querySelector('#sd_nombre').value.trim(),
          direccion: overlay.querySelector('#sd_direccion').value.trim(),
          telefono: overlay.querySelector('#sd_telefono').value.trim(),
          jornada: overlay.querySelector('#sd_jornada').value.trim(),
          horarioAtencion: overlay.querySelector('#sd_horario').value.trim(),
          descripcion: overlay.querySelector('#sd_descripcion').value.trim(),
          activa: overlay.querySelector('#sd_activa').checked
        };
        if (!payload.nombre || !payload.direccion) return alert('Nombre y dirección son obligatorios');
        try {
          if (id) await apiFetch(`/admin/institucional/sedes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          else await apiFetch('/admin/institucional/sedes', { method: 'POST', body: JSON.stringify(payload) });
          closeModal(overlay);
          showToast(id ? 'Sede actualizada' : 'Sede creada');
          loadSedes();
        } catch (err) { alert('Error: ' + err.message); }
      });
    };

    // ==================== ÁREAS ====================
    const loadAreas = async () => {
      setTab(tabAreas);
      instContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando áreas...</div>';
      try {
        const areas = await apiFetch('/admin/institucional/areas');
        instContent.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="h6 mb-0 fw-bold">Áreas (${areas.length})</h4>
            <button id="crearAreaBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Añadir Área</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead><tr>
                <th style="width:50px;">#</th><th>Nombre</th><th>Descripción</th>
                <th style="width:80px;">Activo</th><th class="text-end" style="width:140px;">Acciones</th>
              </tr></thead>
              <tbody>
                ${areas.map(a => `
                  <tr>
                    <td>${a.id}</td>
                    <td><strong>${a.nombre || ''}</strong></td>
                    <td>${a.descripcion || ''}</td>
                    <td>${a.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-primary me-2 btn-edit-area" data-id="${a.id}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-sm btn-danger btn-del-area" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        document.getElementById('crearAreaBtn').addEventListener('click', () => openAreaModal());
        instContent.querySelectorAll('.btn-edit-area').forEach(b => {
          b.addEventListener('click', () => openAreaModal(parseInt(b.dataset.id, 10)));
        });
        instContent.querySelectorAll('.btn-del-area').forEach(b => {
          b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar esta área? Se eliminarán sus contactos.')) return;
            try {
              await apiFetch(`/admin/institucional/areas/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Área eliminada');
              loadAreas();
            } catch (err) { alert(err.message); }
          });
        });
      } catch (err) {
        instContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    const openAreaModal = async (id = null) => {
      let area = { nombre: '', descripcion: '', activo: true };
      if (id) {
        try { area = await apiFetch(`/admin/institucional/areas/${id}`); }
        catch (err) { alert('Error: ' + err.message); return; }
      }
      const html = `
        <h3><i class="fa-solid fa-diagram-project me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Área</h3>
        <div class="form-row mb-3"><label class="fw-semibold">Nombre *</label><input id="ar_nombre" class="form-control" value="${area.nombre || ''}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Descripción</label><textarea id="ar_descripcion" class="form-control" rows="2">${area.descripcion || ''}</textarea></div>
        <div class="form-row mb-3"><label class="fw-semibold d-block"><input id="ar_activo" type="checkbox" ${area.activo !== false ? 'checked' : ''}/> Activo</label></div>
        <div class="modal-actions">
          <button id="ar_cancel" class="btn btn-admin-outline">Cancelar</button>
          <button id="ar_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#ar_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#ar_submit').addEventListener('click', async () => {
        const payload = {
          nombre: overlay.querySelector('#ar_nombre').value.trim(),
          descripcion: overlay.querySelector('#ar_descripcion').value.trim(),
          activo: overlay.querySelector('#ar_activo').checked
        };
        if (!payload.nombre) return alert('El nombre es obligatorio');
        try {
          if (id) await apiFetch(`/admin/institucional/areas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          else await apiFetch('/admin/institucional/areas', { method: 'POST', body: JSON.stringify(payload) });
          closeModal(overlay);
          showToast(id ? 'Área actualizada' : 'Área creada');
          loadAreas();
        } catch (err) { alert('Error: ' + err.message); }
      });
    };

    // ==================== CONTACTOS ====================
    const loadContactos = async () => {
      setTab(tabContactos);
      instContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando contactos...</div>';
      try {
        const [contactos, areas] = await Promise.all([
          apiFetch('/admin/institucional/contactos'),
          apiFetch('/admin/institucional/areas')
        ]);
        instContent.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="h6 mb-0 fw-bold">Contactos (${contactos.length})</h4>
            <button id="crearContactoBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Añadir Contacto</button>
          </div>
          <div class="table-admin-wrap">
            <table class="table-admin">
              <thead><tr>
                <th style="width:50px;">#</th><th>Área</th><th>Tipo</th><th>Valor</th><th>Descripción</th>
                <th style="width:80px;">Activo</th><th class="text-end" style="width:140px;">Acciones</th>
              </tr></thead>
              <tbody>
                ${contactos.map(c => `
                  <tr>
                    <td>${c.id}</td>
                    <td>${c.area ? c.area.nombre : '—'}</td>
                    <td><span class="badge bg-secondary">${c.tipo || ''}</span></td>
                    <td><strong>${c.valor || ''}</strong></td>
                    <td>${c.descripcion || ''}</td>
                    <td>${c.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-primary me-2 btn-edit-cont" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-sm btn-danger btn-del-cont" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        document.getElementById('crearContactoBtn').addEventListener('click', () => openContactoModal(null, areas));
        instContent.querySelectorAll('.btn-edit-cont').forEach(b => {
          b.addEventListener('click', () => openContactoModal(parseInt(b.dataset.id, 10), areas));
        });
        instContent.querySelectorAll('.btn-del-cont').forEach(b => {
          b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este contacto?')) return;
            try {
              await apiFetch(`/admin/institucional/contactos/${b.dataset.id}`, { method: 'DELETE' });
              showToast('Contacto eliminado');
              loadContactos();
            } catch (err) { alert(err.message); }
          });
        });
      } catch (err) {
        instContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    const openContactoModal = async (id = null, areas = []) => {
      let cont = { areaId: areas[0]?.id || null, tipo: 'TELEFONO', valor: '', descripcion: '', activo: true };
      if (id) {
        try {
          const c = await apiFetch(`/admin/institucional/contactos/${id}`);
          cont = { areaId: c.area?.id, tipo: c.tipo, valor: c.valor, descripcion: c.descripcion, activo: c.activo };
        } catch (err) { alert('Error: ' + err.message); return; }
      }
      const html = `
        <h3><i class="fa-solid fa-address-book me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Contacto</h3>
        <div class="form-row mb-3">
          <label class="fw-semibold">Área *</label>
          <select id="co_area" class="form-control">
            ${areas.map(a => `<option value="${a.id}" ${a.id === cont.areaId ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Tipo *</label>
          <select id="co_tipo" class="form-control">
            <option value="TELEFONO" ${cont.tipo === 'TELEFONO' ? 'selected' : ''}>Teléfono</option>
            <option value="CORREO" ${cont.tipo === 'CORREO' ? 'selected' : ''}>Correo</option>
            <option value="WHATSAPP" ${cont.tipo === 'WHATSAPP' ? 'selected' : ''}>WhatsApp</option>
            <option value="DIRECCION" ${cont.tipo === 'DIRECCION' ? 'selected' : ''}>Dirección</option>
          </select>
        </div>
        <div class="form-row mb-3"><label class="fw-semibold">Valor *</label><input id="co_valor" class="form-control" value="${cont.valor || ''}" placeholder="Ej: 1234567 o email@x.com"/></div>
        <div class="form-row mb-3"><label class="fw-semibold">Descripción</label><input id="co_descripcion" class="form-control" value="${cont.descripcion || ''}"/></div>
        <div class="form-row mb-3"><label class="fw-semibold d-block"><input id="co_activo" type="checkbox" ${cont.activo !== false ? 'checked' : ''}/> Activo</label></div>
        <div class="modal-actions">
          <button id="co_cancel" class="btn btn-admin-outline">Cancelar</button>
          <button id="co_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#co_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#co_submit').addEventListener('click', async () => {
        const payload = {
          areaId: parseInt(overlay.querySelector('#co_area').value, 10),
          tipo: overlay.querySelector('#co_tipo').value,
          valor: overlay.querySelector('#co_valor').value.trim(),
          descripcion: overlay.querySelector('#co_descripcion').value.trim(),
          activo: overlay.querySelector('#co_activo').checked
        };
        if (!payload.areaId || !payload.valor) return alert('Área y valor son obligatorios');
        try {
          if (id) await apiFetch(`/admin/institucional/contactos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          else await apiFetch('/admin/institucional/contactos', { method: 'POST', body: JSON.stringify(payload) });
          closeModal(overlay);
          showToast(id ? 'Contacto actualizado' : 'Contacto creado');
          loadContactos();
        } catch (err) { alert('Error: ' + err.message); }
      });
    };

    tabSedes.addEventListener('click', loadSedes);
    tabAreas.addEventListener('click', loadAreas);
    tabContactos.addEventListener('click', loadContactos);

    loadSedes();
  }

  // ---------- GALERÍA ----------
  async function renderGaleria() {
    pageTitle.textContent = 'Galería';
    try {
      const html = await fetch('partials/galeria.html').then(r => r.text());
      viewContainer.innerHTML = html;
      await loadGaleria();
    } catch (err) {
      viewContainer.innerHTML = `<div class="alert alert-danger">No se pudo cargar la vista de galería: ${err.message}</div>`;
      showToast(err.message, 'error');
    }
  }

  async function loadGaleria() {
    try {
      const items = await apiFetch('/admin/galeria');
      const tbody = document.getElementById('galeriaBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!items || !items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay imágenes registradas.</td></tr>`;
        return;
      }

      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.id}</td>
          <td><img src="${item.urlImagen}" alt="${item.titulo || ''}" class="gallery-thumb"></td>
          <td>${item.titulo || ''}</td>
          <td><span class="badge bg-secondary">${item.categoria || 'academico'}</span></td>
          <td>${item.orden != null ? item.orden : 0}</td>
          <td>${item.destacado ? '<i class="fa-solid fa-star text-warning"></i>' : '<span class="text-muted">—</span>'}</td>
          <td>${item.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
          <td>
            <button class="btn btn-sm btn-primary me-2"
                    onclick="editGaleria(${item.id})"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger"
                    onclick="deleteGaleria(${item.id})"><i class="fa-solid fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- Funciones globales de la galería (llamadas vía onclick inline) ---
  // --- Funciones globales de la galería (con subida de archivos) ---
  window.openGaleriaModal = function () {
    const html = `
      <h3><i class="fa-solid fa-image me-2 text-danger"></i>Añadir Imagen</h3>
      <div class="form-row mb-3">
        <label class="fw-semibold">Título *</label>
        <input id="g_titulo" class="form-control" placeholder="Título de la imagen"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Descripción</label>
        <textarea id="g_descripcion" class="form-control" rows="2" placeholder="Descripción breve"></textarea>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Categoría</label>
        <select id="g_categoria" class="form-control">
          <option value="academico">Académico</option>
          <option value="deportes">Deportes</option>
          <option value="cultural">Cultural</option>
          <option value="eventos">Eventos</option>
        </select>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Orden</label>
        <input id="g_orden" type="number" class="form-control" value="0" min="0"/>
        <small class="text-muted">Menor número = aparece primero</small>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="g_destacado" type="checkbox"/> Destacado (aparece primero)
        </label>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="g_activo" type="checkbox" checked/> Activo (visible en el sitio)
        </label>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Archivo de imagen *</label>
        <input id="g_file" type="file" class="form-control" accept="image/*"/>
        <small class="text-muted">JPG, PNG, WEBP. Máximo 10MB.</small>
      </div>
      <div class="form-row mb-3" id="g_preview_wrap" style="display:none;">
        <label class="fw-semibold">Vista previa</label>
        <div><img id="g_preview" style="max-width:100%; max-height:200px; border-radius:8px;"/></div>
      </div>
      <div class="modal-actions">
        <button id="g_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="g_submit" class="btn btn-admin-primary">Subir Imagen</button>
      </div>
    `;
    const overlay = showModal(html);

    // Preview
    const fileInput = overlay.querySelector('#g_file');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          overlay.querySelector('#g_preview').src = ev.target.result;
          overlay.querySelector('#g_preview_wrap').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    overlay.querySelector('#g_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#g_submit').addEventListener('click', async () => {
      const titulo = overlay.querySelector('#g_titulo').value.trim();
      const descripcion = overlay.querySelector('#g_descripcion').value.trim();
      const categoria = overlay.querySelector('#g_categoria').value;
      const file = overlay.querySelector('#g_file').files[0];

      if (!titulo) return alert('El título es obligatorio');
      if (!file) return alert('Debes seleccionar una imagen');
      if (!file.type.startsWith('image/')) return alert('El archivo debe ser una imagen');

      const orden = parseInt(overlay.querySelector('#g_orden').value || '0', 10);
      const destacado = overlay.querySelector('#g_destacado').checked;
      const activo = overlay.querySelector('#g_activo').checked;

      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('categoria', categoria);
      formData.append('orden', orden);
      formData.append('destacado', destacado);
      formData.append('activo', activo);
      formData.append('file', file);

      try {
        await apiFetch('/admin/galeria', {
          method: 'POST',
          body: formData
        });
        closeModal(overlay);
        showToast('Imagen subida correctamente');
        loadGaleria();
      } catch (err) {
        alert('Error al subir: ' + err.message);
      }
    });
  };

  window.editGaleria = async function (id) {
    try {
      const item = await apiFetch(`/admin/galeria/${id}`);
      const html = `
        <h3><i class="fa-solid fa-pen me-2 text-danger"></i>Editar Imagen #${item.id}</h3>
        <div class="form-row mb-3">
          <label class="fw-semibold">Título *</label>
          <input id="g_titulo" class="form-control" value="${item.titulo || ''}"/>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Descripción</label>
          <textarea id="g_descripcion" class="form-control" rows="2">${item.descripcion || ''}</textarea>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Categoría</label>
          <select id="g_categoria" class="form-control">
            <option value="academico" ${item.categoria === 'academico' ? 'selected' : ''}>Académico</option>
            <option value="deportes" ${item.categoria === 'deportes' ? 'selected' : ''}>Deportes</option>
            <option value="cultural" ${item.categoria === 'cultural' ? 'selected' : ''}>Cultural</option>
            <option value="eventos" ${item.categoria === 'eventos' ? 'selected' : ''}>Eventos</option>
          </select>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Orden</label>
          <input id="g_orden" type="number" class="form-control" value="${item.orden != null ? item.orden : 0}" min="0"/>
          <small class="text-muted">Menor número = aparece primero</small>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold d-block">
            <input id="g_destacado" type="checkbox" ${item.destacado ? 'checked' : ''}/> Destacado
          </label>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold d-block">
            <input id="g_activo" type="checkbox" ${item.activo !== false ? 'checked' : ''}/> Activo
          </label>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Imagen actual</label>
          <div><img src="${item.urlImagen || ''}" style="max-width:100%; max-height:200px; border-radius:8px;"/></div>
        </div>
        <div class="form-row mb-3">
          <label class="fw-semibold">Reemplazar imagen (opcional)</label>
          <input id="g_file" type="file" class="form-control" accept="image/*"/>
          <small class="text-muted">Si no seleccionas archivo, se mantiene la imagen actual.</small>
        </div>
        <div class="modal-actions">
          <button id="g_cancel" class="btn btn-admin-outline">Cancelar</button>
          <button id="g_submit" class="btn btn-admin-primary">Guardar Cambios</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#g_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#g_submit').addEventListener('click', async () => {
        const titulo = overlay.querySelector('#g_titulo').value.trim();
        const descripcion = overlay.querySelector('#g_descripcion').value.trim();
        const categoria = overlay.querySelector('#g_categoria').value;
        const file = overlay.querySelector('#g_file').files[0];

        if (!titulo) return alert('El título es obligatorio');

        const orden = parseInt(overlay.querySelector('#g_orden').value || '0', 10);
        const destacado = overlay.querySelector('#g_destacado').checked;
        const activo = overlay.querySelector('#g_activo').checked;

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        formData.append('categoria', categoria);
        formData.append('orden', orden);
        formData.append('destacado', destacado);
        formData.append('activo', activo);
        if (file) formData.append('file', file);

        try {
          await apiFetch(`/admin/galeria/${id}`, {
            method: 'PUT',
            body: formData
          });
          closeModal(overlay);
          showToast('Imagen actualizada');
          loadGaleria();
        } catch (err) {
          alert('Error al actualizar: ' + err.message);
        }
      });
    } catch (err) {
      alert('Error cargando imagen: ' + err.message);
    }
  };

  window.deleteGaleria = async function (id) {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;
    try {
      await apiFetch(`/admin/galeria/${id}`, { method: 'DELETE' });
      showToast('Imagen eliminada');
      loadGaleria();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ---------- CHATBOT ----------
  // ---------- ESTADÍSTICAS ----------
  async function renderEstadisticas() {
    pageTitle.textContent = 'Estadísticas';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-chart-line me-2 text-danger"></i>Gestión de Estadísticas
            </h3>
            <p class="text-muted small mb-0">Las cifras que aparecen en el home del sitio público.</p>
          </div>
          <button id="crearEstBtn" class="btn btn-admin-primary">
            <i class="fa-solid fa-plus me-1"></i> Añadir Estadística
          </button>
        </div>

        <div class="card-admin">
          <div class="card-admin-body p-0">
            <div class="table-admin-wrap">
              <table class="table-admin">
                <thead>
                  <tr>
                    <th style="width:60px;">#</th>
                    <th>Label</th>
                    <th style="width:100px;">Valor</th>
                    <th style="width:80px;">Sufijo</th>
                    <th style="width:200px;">Icono</th>
                    <th style="width:70px;">Orden</th>
                    <th style="width:80px;">Activo</th>
                    <th class="text-end" style="width:140px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="estadisticasBody">
                  <tr><td colspan="8" class="text-center py-4 text-muted">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('crearEstBtn').addEventListener('click', () => openEstadisticaModal());

    await loadEstadisticas();
  }

  async function loadEstadisticas() {
    try {
      const items = await apiFetch('/admin/estadisticas');
      const tbody = document.getElementById('estadisticasBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!items || !items.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No hay estadísticas registradas.</td></tr>`;
        return;
      }

      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.id}</td>
          <td><strong>${item.label || ''}</strong></td>
          <td>${item.value != null ? item.value : 0}</td>
          <td><code>${item.sufijo || ''}</code></td>
          <td><i class="${item.icono || 'fa-solid fa-chart-simple'} me-2"></i><code>${item.icono || ''}</code></td>
          <td>${item.orden != null ? item.orden : 0}</td>
          <td>${item.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary me-2 btn-edit-est" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger btn-del-est" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit-est').forEach(b => {
        b.addEventListener('click', () => openEstadisticaModal(parseInt(b.dataset.id, 10)));
      });

      tbody.querySelectorAll('.btn-del-est').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta estadística?')) return;
          try {
            await apiFetch(`/admin/estadisticas/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Estadística eliminada');
            loadEstadisticas();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function openEstadisticaModal(id = null) {
    let item = { label: '', value: 0, sufijo: '', icono: 'fa-solid fa-chart-simple', orden: 0, activo: true };
    if (id) {
      try {
        item = await apiFetch(`/admin/estadisticas/${id}`);
      } catch (err) {
        alert('No se pudo cargar: ' + err.message);
        return;
      }
    }

    const html = `
      <h3><i class="fa-solid fa-chart-line me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Estadística</h3>
      <div class="form-row mb-3">
        <label class="fw-semibold">Label *</label>
        <input id="e_label" class="form-control" value="${item.label || ''}" placeholder="Ej: Estudiantes"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Valor *</label>
        <input id="e_value" type="number" class="form-control" value="${item.value != null ? item.value : 0}"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Sufijo (opcional)</label>
        <input id="e_sufijo" class="form-control" value="${item.sufijo || ''}" placeholder="Ej: +"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Icono FontAwesome</label>
        <input id="e_icono" class="form-control" value="${item.icono || 'fa-solid fa-chart-simple'}" placeholder="fa-solid fa-user-graduate"/>
        <small class="text-muted">Vista previa: <i id="e_icono_preview" class="${item.icono || 'fa-solid fa-chart-simple'}"></i></small>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Orden</label>
        <input id="e_orden" type="number" class="form-control" value="${item.orden != null ? item.orden : 0}" min="0"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="e_activo" type="checkbox" ${item.activo !== false ? 'checked' : ''}/> Activo
        </label>
      </div>
      <div class="modal-actions">
        <button id="e_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="e_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);

    // Preview del icono
    const iconoInput = overlay.querySelector('#e_icono');
    iconoInput.addEventListener('input', (ev) => {
      overlay.querySelector('#e_icono_preview').className = ev.target.value;
    });

    overlay.querySelector('#e_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#e_submit').addEventListener('click', async () => {
      const label = overlay.querySelector('#e_label').value.trim();
      const value = parseInt(overlay.querySelector('#e_value').value || '0', 10);
      const sufijo = overlay.querySelector('#e_sufijo').value.trim();
      const icono = overlay.querySelector('#e_icono').value.trim();
      const orden = parseInt(overlay.querySelector('#e_orden').value || '0', 10);
      const activo = overlay.querySelector('#e_activo').checked;

      if (!label) return alert('El label es obligatorio');

      const payload = { label, value, sufijo, icono, orden, activo };

      try {
        if (id) {
          await apiFetch(`/admin/estadisticas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showToast('Estadística actualizada');
        } else {
          await apiFetch('/admin/estadisticas', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Estadística creada');
        }
        closeModal(overlay);
        loadEstadisticas();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // ---------- EQUIPO DIRECTIVO ----------
  async function renderEquipo() {
    pageTitle.textContent = 'Equipo Directivo';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-user-tie me-2 text-danger"></i>Gestión de Equipo Directivo
            </h3>
            <p class="text-muted small mb-0">Los directivos que aparecen en el sitio público.</p>
          </div>
          <button id="crearEqBtn" class="btn btn-admin-primary">
            <i class="fa-solid fa-plus me-1"></i> Añadir Miembro
          </button>
        </div>

        <div class="card-admin">
          <div class="card-admin-body p-0">
            <div class="table-admin-wrap">
              <table class="table-admin">
                <thead>
                  <tr>
                    <th style="width:60px;">#</th>
                    <th style="width:100px;">Foto</th>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th style="width:70px;">Orden</th>
                    <th style="width:80px;">Activo</th>
                    <th class="text-end" style="width:140px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="equipoBody">
                  <tr><td colspan="7" class="text-center py-4 text-muted">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('crearEqBtn').addEventListener('click', () => openEquipoModal());

    await loadEquipo();
  }

  async function loadEquipo() {
    try {
      const items = await apiFetch('/admin/equipo');
      const tbody = document.getElementById('equipoBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!items || !items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay miembros registrados.</td></tr>`;
        return;
      }

      items.forEach(item => {
        const tr = document.createElement('tr');
        const fotoSrc = item.fotoUrl ? (item.fotoUrl.startsWith('/') || item.fotoUrl.startsWith('http') ? item.fotoUrl : '/' + item.fotoUrl) : '';
        tr.innerHTML = `
          <td>${item.id}</td>
          <td>${fotoSrc ? `<img src="${fotoSrc}" alt="${item.nombre || ''}" class="gallery-thumb" style="width:60px;height:60px;object-fit:cover;border-radius:50%;">` : '<span class="text-muted">—</span>'}</td>
          <td><strong>${item.nombre || ''}</strong></td>
          <td>${item.cargo || ''}</td>
          <td>${item.orden != null ? item.orden : 0}</td>
          <td>${item.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary me-2 btn-edit-eq" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger btn-del-eq" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit-eq').forEach(b => {
        b.addEventListener('click', () => openEquipoModal(parseInt(b.dataset.id, 10)));
      });

      tbody.querySelectorAll('.btn-del-eq').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar este miembro?')) return;
          try {
            await apiFetch(`/admin/equipo/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Miembro eliminado');
            loadEquipo();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function openEquipoModal(id = null) {
    let item = { nombre: '', cargo: '', fotoUrl: '', orden: 0, activo: true };
    if (id) {
      try {
        item = await apiFetch(`/admin/equipo/${id}`);
      } catch (err) {
        alert('No se pudo cargar: ' + err.message);
        return;
      }
    }

    const fotoActualSrc = item.fotoUrl ? (item.fotoUrl.startsWith('/') || item.fotoUrl.startsWith('http') ? item.fotoUrl : '/' + item.fotoUrl) : '';

    const html = `
      <h3><i class="fa-solid fa-user-tie me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Miembro</h3>
      <div class="form-row mb-3">
        <label class="fw-semibold">Nombre *</label>
        <input id="eq_nombre" class="form-control" value="${item.nombre || ''}" placeholder="Ej: Elkin Marquez Fernandez"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Cargo *</label>
        <input id="eq_cargo" class="form-control" value="${item.cargo || ''}" placeholder="Ej: Rector"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Orden</label>
        <input id="eq_orden" type="number" class="form-control" value="${item.orden != null ? item.orden : 0}" min="0"/>
        <small class="text-muted">Menor número = aparece primero</small>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="eq_activo" type="checkbox" ${item.activo !== false ? 'checked' : ''}/> Activo
        </label>
      </div>
      ${id && fotoActualSrc ? `
        <div class="form-row mb-3">
          <label class="fw-semibold">Foto actual</label>
          <div><img src="${fotoActualSrc}" style="max-width:120px; max-height:120px; border-radius:50%; object-fit:cover;"/></div>
        </div>
      ` : ''}
      <div class="form-row mb-3">
        <label class="fw-semibold">${id ? 'Reemplazar foto (opcional)' : 'Foto *'}</label>
        <input id="eq_file" type="file" class="form-control" accept="image/*"/>
        <small class="text-muted">JPG, PNG, WEBP. Máximo 10MB.</small>
      </div>
      <div class="form-row mb-3" id="eq_preview_wrap" style="display:none;">
        <label class="fw-semibold">Vista previa</label>
        <div><img id="eq_preview" style="max-width:120px; max-height:120px; border-radius:50%; object-fit:cover;"/></div>
      </div>
      <div class="modal-actions">
        <button id="eq_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="eq_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);

    // Preview
    const fileInput = overlay.querySelector('#eq_file');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          overlay.querySelector('#eq_preview').src = ev.target.result;
          overlay.querySelector('#eq_preview_wrap').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    overlay.querySelector('#eq_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#eq_submit').addEventListener('click', async () => {
      const nombre = overlay.querySelector('#eq_nombre').value.trim();
      const cargo = overlay.querySelector('#eq_cargo').value.trim();
      const orden = parseInt(overlay.querySelector('#eq_orden').value || '0', 10);
      const activo = overlay.querySelector('#eq_activo').checked;
      const file = overlay.querySelector('#eq_file').files[0];

      if (!nombre) return alert('El nombre es obligatorio');
      if (!cargo) return alert('El cargo es obligatorio');
      if (!id && !file) return alert('La foto es obligatoria');

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('cargo', cargo);
      formData.append('orden', orden);
      formData.append('activo', activo);
      if (file) formData.append('file', file);

      try {
        if (id) {
          await apiFetch(`/admin/equipo/${id}`, { method: 'PUT', body: formData });
          showToast('Miembro actualizado');
        } else {
          await apiFetch('/admin/equipo', { method: 'POST', body: formData });
          showToast('Miembro creado');
        }
        closeModal(overlay);
        loadEquipo();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // ---------- VALORES INSTITUCIONALES ----------
  async function renderValores() {
    pageTitle.textContent = 'Valores Institucionales';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-hand-holding-heart me-2 text-danger"></i>Gestión de Valores
            </h3>
            <p class="text-muted small mb-0">Los valores que aparecen en el sitio público.</p>
          </div>
          <button id="crearValBtn" class="btn btn-admin-primary">
            <i class="fa-solid fa-plus me-1"></i> Añadir Valor
          </button>
        </div>

        <div class="card-admin">
          <div class="card-admin-body p-0">
            <div class="table-admin-wrap">
              <table class="table-admin">
                <thead>
                  <tr>
                    <th style="width:60px;">#</th>
                    <th style="width:80px;">Icono</th>
                    <th>Título</th>
                    <th>Descripción</th>
                    <th style="width:70px;">Orden</th>
                    <th style="width:80px;">Activo</th>
                    <th class="text-end" style="width:140px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="valoresBody">
                  <tr><td colspan="7" class="text-center py-4 text-muted">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('crearValBtn').addEventListener('click', () => openValorModal());

    await loadValores();
  }

  async function loadValores() {
    try {
      const items = await apiFetch('/admin/valores');
      const tbody = document.getElementById('valoresBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!items || !items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay valores registrados.</td></tr>`;
        return;
      }

      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.id}</td>
          <td style="text-align:center; font-size:1.5rem; color:#c8102e;"><i class="${item.icono || 'fa-solid fa-star'}"></i></td>
          <td><strong>${item.titulo || ''}</strong></td>
          <td>${item.descripcion || ''}</td>
          <td>${item.orden != null ? item.orden : 0}</td>
          <td>${item.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary me-2 btn-edit-val" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger btn-del-val" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit-val').forEach(b => {
        b.addEventListener('click', () => openValorModal(parseInt(b.dataset.id, 10)));
      });

      tbody.querySelectorAll('.btn-del-val').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar este valor?')) return;
          try {
            await apiFetch(`/admin/valores/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Valor eliminado');
            loadValores();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function openValorModal(id = null) {
    let item = { icono: 'fa-solid fa-star', titulo: '', descripcion: '', orden: 0, activo: true };
    if (id) {
      try {
        item = await apiFetch(`/admin/valores/${id}`);
      } catch (err) {
        alert('No se pudo cargar: ' + err.message);
        return;
      }
    }

    const html = `
      <h3><i class="fa-solid fa-hand-holding-heart me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Valor</h3>
      <div class="form-row mb-3">
        <label class="fw-semibold">Icono FontAwesome *</label>
        <input id="v_icono" class="form-control" value="${item.icono || 'fa-solid fa-star'}" placeholder="fa-solid fa-handshake-angle"/>
        <small class="text-muted">Vista previa: <i id="v_icono_preview" class="${item.icono || 'fa-solid fa-star'}" style="color:#c8102e; font-size:1.5rem;"></i></small>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Título *</label>
        <input id="v_titulo" class="form-control" value="${item.titulo || ''}" placeholder="Ej: Respeto"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Descripción</label>
        <textarea id="v_descripcion" class="form-control" rows="2" placeholder="Ej: Reconocemos la dignidad de cada persona.">${item.descripcion || ''}</textarea>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Orden</label>
        <input id="v_orden" type="number" class="form-control" value="${item.orden != null ? item.orden : 0}" min="0"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="v_activo" type="checkbox" ${item.activo !== false ? 'checked' : ''}/> Activo
        </label>
      </div>
      <div class="modal-actions">
        <button id="v_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="v_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);

    // Preview del icono
    const iconoInput = overlay.querySelector('#v_icono');
    iconoInput.addEventListener('input', (ev) => {
      overlay.querySelector('#v_icono_preview').className = ev.target.value;
    });

    overlay.querySelector('#v_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#v_submit').addEventListener('click', async () => {
      const icono = overlay.querySelector('#v_icono').value.trim();
      const titulo = overlay.querySelector('#v_titulo').value.trim();
      const descripcion = overlay.querySelector('#v_descripcion').value.trim();
      const orden = parseInt(overlay.querySelector('#v_orden').value || '0', 10);
      const activo = overlay.querySelector('#v_activo').checked;

      if (!icono) return alert('El icono es obligatorio');
      if (!titulo) return alert('El título es obligatorio');

      const payload = { icono, titulo, descripcion, orden, activo };

      try {
        if (id) {
          await apiFetch(`/admin/valores/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showToast('Valor actualizado');
        } else {
          await apiFetch('/admin/valores', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Valor creado');
        }
        closeModal(overlay);
        loadValores();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // ---------- SERVICIOS INSTITUCIONALES ----------
  async function renderServicios() {
    pageTitle.textContent = 'Servicios Institucionales';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-bell-concierge me-2 text-danger"></i>Gestión de Servicios
            </h3>
            <p class="text-muted small mb-0">Los servicios que aparecen en el sitio público.</p>
          </div>
          <button id="crearServBtn" class="btn btn-admin-primary">
            <i class="fa-solid fa-plus me-1"></i> Añadir Servicio
          </button>
        </div>

        <div class="card-admin">
          <div class="card-admin-body p-0">
            <div class="table-admin-wrap">
              <table class="table-admin">
                <thead>
                  <tr>
                    <th style="width:60px;">#</th>
                    <th style="width:80px;">Icono</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Horario</th>
                    <th style="width:70px;">Orden</th>
                    <th style="width:80px;">Activo</th>
                    <th class="text-end" style="width:140px;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="serviciosBody">
                  <tr><td colspan="8" class="text-center py-4 text-muted">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('crearServBtn').addEventListener('click', () => openServicioModal());

    await loadServicios();
  }

  async function loadServicios() {
    try {
      const items = await apiFetch('/admin/servicios');
      const tbody = document.getElementById('serviciosBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (!items || !items.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No hay servicios registrados.</td></tr>`;
        return;
      }

      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.id}</td>
          <td style="text-align:center; font-size:1.5rem; color:#c8102e;"><i class="${item.icono || 'fa-solid fa-star'}"></i></td>
          <td><strong>${item.nombre || ''}</strong></td>
          <td>${item.descripcion || ''}</td>
          <td><small class="text-muted">${item.horario || ''}</small></td>
          <td>${item.orden != null ? item.orden : 0}</td>
          <td>${item.activo !== false ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary me-2 btn-edit-serv" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger btn-del-serv" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit-serv').forEach(b => {
        b.addEventListener('click', () => openServicioModal(parseInt(b.dataset.id, 10)));
      });

      tbody.querySelectorAll('.btn-del-serv').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar este servicio?')) return;
          try {
            await apiFetch(`/admin/servicios/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Servicio eliminado');
            loadServicios();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function openServicioModal(id = null) {
    let item = { icono: 'fa-solid fa-star', nombre: '', descripcion: '', horario: '', orden: 0, activo: true };
    if (id) {
      try {
        item = await apiFetch(`/admin/servicios/${id}`);
      } catch (err) {
        alert('No se pudo cargar: ' + err.message);
        return;
      }
    }

    const html = `
      <h3><i class="fa-solid fa-bell-concierge me-2 text-danger"></i>${id ? 'Editar' : 'Añadir'} Servicio</h3>
      <div class="form-row mb-3">
        <label class="fw-semibold">Icono FontAwesome *</label>
        <input id="s_icono" class="form-control" value="${item.icono || 'fa-solid fa-star'}" placeholder="fa-solid fa-book"/>
        <small class="text-muted">Vista previa: <i id="s_icono_preview" class="${item.icono || 'fa-solid fa-star'}" style="color:#c8102e; font-size:1.5rem;"></i></small>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Nombre *</label>
        <input id="s_nombre" class="form-control" value="${item.nombre || ''}" placeholder="Ej: Biblioteca"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Descripción</label>
        <textarea id="s_descripcion" class="form-control" rows="2" placeholder="Ej: Servicio de préstamo y consulta de libros">${item.descripcion || ''}</textarea>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Horario</label>
        <input id="s_horario" class="form-control" value="${item.horario || ''}" placeholder="Ej: Lunes a viernes 8:00 AM - 6:00 PM"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold">Orden</label>
        <input id="s_orden" type="number" class="form-control" value="${item.orden != null ? item.orden : 0}" min="0"/>
      </div>
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="s_activo" type="checkbox" ${item.activo !== false ? 'checked' : ''}/> Activo
        </label>
      </div>
      <div class="modal-actions">
        <button id="s_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="s_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);

    // Preview del icono
    const iconoInput = overlay.querySelector('#s_icono');
    iconoInput.addEventListener('input', (ev) => {
      overlay.querySelector('#s_icono_preview').className = ev.target.value;
    });

    overlay.querySelector('#s_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#s_submit').addEventListener('click', async () => {
      const icono = overlay.querySelector('#s_icono').value.trim();
      const nombre = overlay.querySelector('#s_nombre').value.trim();
      const descripcion = overlay.querySelector('#s_descripcion').value.trim();
      const horario = overlay.querySelector('#s_horario').value.trim();
      const orden = parseInt(overlay.querySelector('#s_orden').value || '0', 10);
      const activo = overlay.querySelector('#s_activo').checked;

      if (!icono) return alert('El icono es obligatorio');
      if (!nombre) return alert('El nombre es obligatorio');

      const payload = { icono, nombre, descripcion, horario, orden, activo };

      try {
        if (id) {
          await apiFetch(`/admin/servicios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
          showToast('Servicio actualizado');
        } else {
          await apiFetch('/admin/servicios', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Servicio creado');
        }
        closeModal(overlay);
        loadServicios();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // ---------- CONFIGURACIÓN GENERAL ----------
  async function renderConfiguracion() {
    pageTitle.textContent = 'Configuración General';
    viewContainer.innerHTML = `
      <div class="admin-section">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="section-title mb-1">
              <i class="fa-solid fa-gear me-2 text-danger"></i>Configuración General
            </h3>
            <p class="text-muted small mb-0">Edita el contenido principal que se muestra en el sitio público.</p>
          </div>
        </div>

        <div class="card-admin">
          <div class="admin-tab-nav">
            <button id="tabHero" class="admin-tab-btn active"><i class="fa-solid fa-star me-2"></i>Hero</button>
            <button id="tabInfoInst" class="admin-tab-btn"><i class="fa-solid fa-landmark me-2"></i>Info Institucional</button>
            <button id="tabContacto" class="admin-tab-btn"><i class="fa-solid fa-address-card me-2"></i>Contacto</button>
            <button id="tabRedes" class="admin-tab-btn"><i class="fa-solid fa-share-nodes me-2"></i>Redes</button>
          </div>
          <div class="card-admin-body" id="configContent">
            <div class="text-center py-4 text-muted">Cargando...</div>
          </div>
        </div>
      </div>
    `;

    const tabHero = document.getElementById('tabHero');
    const tabInfoInst = document.getElementById('tabInfoInst');
    const tabContacto = document.getElementById('tabContacto');
    const tabRedes = document.getElementById('tabRedes');
    const configContent = document.getElementById('configContent');

    const setTab = (active) => {
      [tabHero, tabInfoInst, tabContacto, tabRedes].forEach(t => t.classList.remove('active'));
      active.classList.add('active');
    };

    // ==================== HERO ====================
    const loadHero = async () => {
      setTab(tabHero);
      configContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando...</div>';
      try {
        const config = await apiFetch('/admin/configuracion');
        const map = {};
        config.forEach(c => { map[c.clave] = c.valor || ''; });

        configContent.innerHTML = `
          <h4 class="h6 fw-bold mb-3">Contenido del Hero (portada)</h4>
          <div class="form-row mb-3">
            <label class="fw-semibold">Título del Hero</label>
            <input id="cfg_hero_titulo" class="form-control" value="${map.hero_titulo || ''}" placeholder="Ej: Darío Torregroza Pérez"/>
            <small class="text-muted">Aparece como H1 en la portada</small>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Frase del Hero</label>
            <input id="cfg_hero_frase" class="form-control" value="${map.hero_frase || ''}" placeholder="Ej: Camino a la excelencia"/>
            <small class="text-muted">Aparece debajo del título</small>
          </div>
          <div class="modal-actions">
            <button id="cfg_hero_save" class="btn btn-admin-primary"><i class="fa-solid fa-save me-1"></i> Guardar Cambios</button>
          </div>
        `;

        document.getElementById('cfg_hero_save').addEventListener('click', async () => {
          const payload = {
            hero_titulo: document.getElementById('cfg_hero_titulo').value.trim(),
            hero_frase: document.getElementById('cfg_hero_frase').value.trim()
          };
          try {
            await apiFetch('/admin/configuracion', { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Hero actualizado');
          } catch (err) { alert('Error: ' + err.message); }
        });
      } catch (err) {
        configContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    // ==================== INFO INSTITUCIONAL ====================
    const loadInfoInst = async () => {
      setTab(tabInfoInst);
      configContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando...</div>';
      try {
        const info = await apiFetch('/admin/institucional/info');
        configContent.innerHTML = `
          <h4 class="h6 fw-bold mb-3">Información Institucional</h4>
          <div class="form-row mb-3">
            <label class="fw-semibold">Nombre Institución</label>
            <input id="ii_nombreInstitucion" class="form-control" value="${info.nombreInstitucion || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Descripción</label>
            <textarea id="ii_descripcion" class="form-control" rows="2">${info.descripcion || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Historia</label>
            <textarea id="ii_historia" class="form-control" rows="4">${info.historia || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Misión</label>
            <textarea id="ii_mision" class="form-control" rows="4">${info.mision || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Visión</label>
            <textarea id="ii_vision" class="form-control" rows="4">${info.vision || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Valores</label>
            <textarea id="ii_valores" class="form-control" rows="3">${info.valores || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Filosofía</label>
            <textarea id="ii_filosofia" class="form-control" rows="3">${info.filosofia || ''}</textarea>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Teléfono General</label>
            <input id="ii_telefonoGeneral" class="form-control" value="${info.telefonoGeneral || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Correo General</label>
            <input id="ii_correoGeneral" class="form-control" value="${info.correoGeneral || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Sitio Web</label>
            <input id="ii_sitioWeb" class="form-control" value="${info.sitioWeb || ''}"/>
          </div>
          <div class="modal-actions">
            <button id="cfg_info_save" class="btn btn-admin-primary"><i class="fa-solid fa-save me-1"></i> Guardar Cambios</button>
          </div>
        `;

        document.getElementById('cfg_info_save').addEventListener('click', async () => {
          const payload = {
            nombre: document.getElementById('ii_nombreInstitucion').value.trim(),
            nombreInstitucion: document.getElementById('ii_nombreInstitucion').value.trim(),
            descripcion: document.getElementById('ii_descripcion').value.trim(),
            historia: document.getElementById('ii_historia').value.trim(),
            mision: document.getElementById('ii_mision').value.trim(),
            vision: document.getElementById('ii_vision').value.trim(),
            valores: document.getElementById('ii_valores').value.trim(),
            filosofia: document.getElementById('ii_filosofia').value.trim(),
            telefonoGeneral: document.getElementById('ii_telefonoGeneral').value.trim(),
            correoGeneral: document.getElementById('ii_correoGeneral').value.trim(),
            sitioWeb: document.getElementById('ii_sitioWeb').value.trim()
          };
          try {
            await apiFetch(`/admin/institucional/info/${info.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Información institucional actualizada');
          } catch (err) { alert('Error: ' + err.message); }
        });
      } catch (err) {
        configContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    // ==================== CONTACTO ====================
    const loadContacto = async () => {
      setTab(tabContacto);
      configContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando...</div>';
      try {
        const config = await apiFetch('/admin/configuracion');
        const map = {};
        config.forEach(c => { map[c.clave] = c.valor || ''; });

        configContent.innerHTML = `
          <h4 class="h6 fw-bold mb-3">Datos de Contacto</h4>
          <div class="form-row mb-3">
            <label class="fw-semibold">Dirección</label>
            <input id="cfg_direccion" class="form-control" value="${map.direccion || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Teléfono</label>
            <input id="cfg_telefono" class="form-control" value="${map.telefono || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Email</label>
            <input id="cfg_email" class="form-control" value="${map.email || ''}"/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">📍 Ubicación en el Mapa</label>
            
            <div class="alert alert-info small mb-2">
              <i class="fa-solid fa-lightbulb me-1"></i>
              <strong>Opción 1 (recomendada):</strong> Escribe el nombre del lugar y el sistema genera el mapa automáticamente.
            </div>
            
            <div class="input-group mb-2">
              <input id="cfg_lugar" class="form-control" 
                     placeholder="Ej: Colegio Darío Torregroza, Ciénaga Magdalena"
                     value=""/>
              <button id="cfg_generar_mapa" class="btn btn-admin-primary" type="button">
                <i class="fa-solid fa-magnifying-glass me-1"></i> Generar
              </button>
            </div>
            
            <details class="mb-2">
              <summary class="text-muted small" style="cursor:pointer;">
                <i class="fa-solid fa-chevron-right me-1"></i>
                <strong>Opción 2 (avanzada):</strong> Pegar código HTML de Google Maps
              </summary>
              <div class="mt-2 p-2 bg-light rounded">
                <ol class="small mb-2 ps-3">
                  <li>Ve a <a href="https://maps.google.com" target="_blank">Google Maps</a></li>
                  <li>Busca tu institución</li>
                  <li>Click en <strong>Compartir</strong> → <strong>Insertar un mapa</strong></li>
                  <li>Copia el código HTML completo</li>
                  <li>Pégalo aquí:</li>
                </ol>
                <textarea id="cfg_mapa_embed_html" class="form-control" rows="3" 
                          placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'></textarea>
                <button id="cfg_extraer_mapa" class="btn btn-sm btn-admin-outline mt-2" type="button">
                  <i class="fa-solid fa-check me-1"></i> Extraer URL del código
                </button>
              </div>
            </details>
            
            <input type="hidden" id="cfg_mapa_embed" value="${map.mapa_embed || ''}"/>
            
            <div class="mb-2">
              <label class="fw-semibold small mb-1">Vista previa del mapa:</label>
              <div id="cfg_mapa_preview" class="border rounded overflow-hidden" style="height:250px; background:#f5f5f5;">
                <div class="text-center py-5 text-muted">
                  <i class="fa-solid fa-map fa-2x mb-2"></i><br>
                  <small>Sin mapa configurado</small>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Logo Institucional</label>
            <div class="mb-2">
              <img id="cfg_logo_preview" src="${(map.logo_url || 'imagenes/Logo IEDTP.jpeg').startsWith('/') || (map.logo_url || '').startsWith('http') ? map.logo_url : '/' + (map.logo_url || 'imagenes/Logo IEDTP.jpeg')}" 
                   style="max-width:120px; max-height:120px; border-radius:50%; border:3px solid #c8102e; padding:4px; background:#fff;" 
                   alt="Logo actual"/>
            </div>
            <input id="cfg_logo_file" type="file" class="form-control" accept="image/*"/>
            <small class="text-muted">JPG, PNG, SVG, WEBP. Máximo 5MB.</small>
            <div class="mt-2 d-flex gap-2">
              <button id="cfg_logo_upload" class="btn btn-admin-primary btn-sm">
                <i class="fa-solid fa-upload me-1"></i> Subir Logo
              </button>
              <button id="cfg_logo_restore" class="btn btn-admin-outline btn-sm">
                <i class="fa-solid fa-rotate-left me-1"></i> Restaurar Original
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <button id="cfg_contacto_save" class="btn btn-admin-primary"><i class="fa-solid fa-save me-1"></i> Guardar Cambios</button>
          </div>
        `;

        // Preview al seleccionar archivo
        const logoFileInput = document.getElementById('cfg_logo_file');
        logoFileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.getElementById('cfg_logo_preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
          }
        });

        // Botón "Subir Logo"
        document.getElementById('cfg_logo_upload').addEventListener('click', async () => {
          const file = logoFileInput.files[0];
          if (!file) return alert('Selecciona una imagen primero');
          if (!file.type.startsWith('image/')) return alert('El archivo debe ser una imagen');

          const formData = new FormData();
          formData.append('file', file);

          try {
            const res = await apiFetch('/admin/configuracion/upload-logo', {
              method: 'POST',
              body: formData
            });
            showToast('Logo actualizado: ' + res.logo_url);
            // Recargar la vista para reflejar el cambio
            loadContacto();
          } catch (err) {
            alert('Error al subir logo: ' + err.message);
          }
        });

        // Botón "Restaurar Original"
        document.getElementById('cfg_logo_restore').addEventListener('click', async () => {
          if (!confirm('¿Restaurar el logo original del sistema?')) return;
          try {
            await apiFetch('/admin/configuracion/restore-logo', { method: 'POST' });
            showToast('Logo restaurado');
            loadContacto();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        });

        // ═══════════════════════════════════════════════════
        // MAPA INTUITIVO
        // ═══════════════════════════════════════════════════
        
        const mapaEmbedInput = document.getElementById('cfg_mapa_embed');
        const mapaPreview = document.getElementById('cfg_mapa_preview');
        
        // Función para actualizar la vista previa del mapa
        const updateMapaPreview = (embedUrl) => {
          if (!embedUrl) {
            mapaPreview.innerHTML = `
              <div class="text-center py-5 text-muted">
                <i class="fa-solid fa-map fa-2x mb-2"></i><br>
                <small>Sin mapa configurado</small>
              </div>`;
            return;
          }
          // Si el embedUrl es una URL completa, mostrarla como iframe
          let src = embedUrl;
          // Si viene con comillas o iframe, extraer solo la URL
          if (embedUrl.includes('src=')) {
            const match = embedUrl.match(/src=["']([^"']+)["']/);
            if (match) src = match[1];
          }
          mapaPreview.innerHTML = `
            <iframe src="${src}" width="100%" height="100%" 
                    style="border:0;" allowfullscreen="" loading="lazy" 
                    referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        };
        
        // Cargar mapa actual
        updateMapaPreview(mapaEmbedInput.value);
        
        // Botón "Generar mapa desde lugar"
        document.getElementById('cfg_generar_mapa').addEventListener('click', () => {
          const lugar = document.getElementById('cfg_lugar').value.trim();
          if (!lugar) return alert('Escribe un lugar primero');
          
          // Generar URL de embed simple de Google Maps
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(lugar)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          
          mapaEmbedInput.value = embedUrl;
          updateMapaPreview(embedUrl);
          showToast('Mapa generado. No olvides guardar los cambios.');
        });
        
        // Botón "Extraer URL del código"
        document.getElementById('cfg_extraer_mapa').addEventListener('click', () => {
          const html = document.getElementById('cfg_mapa_embed_html').value.trim();
          if (!html) return alert('Pega el código HTML de Google Maps primero');
          
          const match = html.match(/src=["']([^"']+)["']/);
          if (!match) return alert('No se encontró una URL válida en el código');
          
          mapaEmbedInput.value = match[1];
          updateMapaPreview(match[1]);
          document.getElementById('cfg_mapa_embed_html').value = '';
          showToast('URL extraída correctamente. No olvides guardar.');
        });
        
        // ═══════════════════════════════════════════════════
        // GUARDAR CAMBIOS
        // ═══════════════════════════════════════════════════
        document.getElementById('cfg_contacto_save').addEventListener('click', async () => {
          const payload = {
            direccion: document.getElementById('cfg_direccion').value.trim(),
            telefono: document.getElementById('cfg_telefono').value.trim(),
            email: document.getElementById('cfg_email').value.trim(),
            mapa_embed: mapaEmbedInput.value.trim()
          };
          try {
            await apiFetch('/admin/configuracion', { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Contacto actualizado');
          } catch (err) { alert('Error: ' + err.message); }
        });
      } catch (err) {
        configContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    // ==================== REDES ====================
    const loadRedes = async () => {
      setTab(tabRedes);
      configContent.innerHTML = '<div class="text-center py-4 text-muted">Cargando...</div>';
      try {
        const config = await apiFetch('/admin/configuracion');
        const map = {};
        config.forEach(c => { map[c.clave] = c.valor || ''; });

        configContent.innerHTML = `
          <h4 class="h6 fw-bold mb-3">Redes Sociales</h4>
          <div class="form-row mb-3">
            <label class="fw-semibold"><i class="fa-brands fa-facebook me-2" style="color:#1877f2"></i>Facebook</label>
            <input id="cfg_facebook" class="form-control" value="${map.facebook || ''}" placeholder="https://facebook.com/..."/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold"><i class="fa-brands fa-instagram me-2" style="color:#e4405f"></i>Instagram</label>
            <input id="cfg_instagram" class="form-control" value="${map.instagram || ''}" placeholder="https://instagram.com/..."/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold"><i class="fa-brands fa-youtube me-2" style="color:#ff0000"></i>YouTube</label>
            <input id="cfg_youtube" class="form-control" value="${map.youtube || ''}" placeholder="https://youtube.com/..."/>
          </div>
          <div class="form-row mb-3">
            <label class="fw-semibold">Instagram (dejar vacío si no aplica)</label>
            <input id="cfg_instagram_2" class="form-control" value="${map.instagram || ''}" disabled style="display:none"/>
          </div>
          <div class="modal-actions">
            <button id="cfg_redes_save" class="btn btn-admin-primary"><i class="fa-solid fa-save me-1"></i> Guardar Cambios</button>
          </div>
        `;

        document.getElementById('cfg_redes_save').addEventListener('click', async () => {
          const payload = {
            facebook: document.getElementById('cfg_facebook').value.trim(),
            instagram: document.getElementById('cfg_instagram').value.trim(),
            youtube: document.getElementById('cfg_youtube').value.trim()
          };
          try {
            await apiFetch('/admin/configuracion', { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Redes actualizadas');
          } catch (err) { alert('Error: ' + err.message); }
        });
      } catch (err) {
        configContent.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      }
    };

    tabHero.addEventListener('click', loadHero);
    tabInfoInst.addEventListener('click', loadInfoInst);
    tabContacto.addEventListener('click', loadContacto);
    tabRedes.addEventListener('click', loadRedes);

    loadHero();
  }

  // ═══════════════════════════════════════════════════════
// ESTADÍSTICAS DEL CHATBOT
// ═══════════════════════════════════════════════════════
async function renderEstadisticasChatbot() {
  pageTitle.textContent = 'Estadísticas del Chatbot';
  viewContainer.innerHTML = `
    <div class="admin-section">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 class="section-title mb-1">
            <i class="fa-solid fa-chart-line me-2 text-danger"></i>Estadísticas del Chatbot
          </h3>
          <p class="text-muted small mb-0">Métricas de uso y comportamiento del asistente virtual.</p>
        </div>
        <button id="refreshStatsBtn" class="btn btn-admin-primary">
          <i class="fa-solid fa-rotate me-1"></i> Actualizar
        </button>
      </div>
      <div id="statsContent">
        <div class="text-center py-5">
          <div class="spinner-border text-danger" role="status"></div>
          <p class="text-muted mt-2">Cargando estadísticas...</p>
        </div>
      </div>
    </div>
  `;

  const content = document.getElementById('statsContent');

  const cargarEstadisticas = async () => {
    try {
      const stats = await apiFetch('/admin/chatbot/estadisticas');
      
      // Calcular el máximo para las barras del gráfico de actividad
      const maxActividad = Math.max(...stats.actividadUltimos7Dias.map(d => d.mensajes), 1);
      const maxIntencion = Math.max(...stats.topIntenciones.map(i => i.total), 1);
      
      // Total de feedbacks para el porcentaje
      const totalFeedback = stats.feedbackPositivo + stats.feedbackNegativo;
      const porcentajeSatisfaccion = totalFeedback > 0 
        ? Math.round(stats.feedbackPositivo * 100 / totalFeedback) 
        : 0;

      content.innerHTML = `
        <!-- TARJETAS DE MÉTRICAS -->
        <div class="row g-3 mb-4">
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(200,16,46,0.1); color: #c8102e;">
                <i class="fa-solid fa-comments"></i>
              </div>
              <div>
                <div class="stat-number">${stats.totalConversaciones.toLocaleString()}</div>
                <div class="stat-label-mini">Conversaciones</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(37,99,235,0.1); color: #2563eb;">
                <i class="fa-solid fa-envelope"></i>
              </div>
              <div>
                <div class="stat-number">${stats.totalMensajes.toLocaleString()}</div>
                <div class="stat-label-mini">Mensajes Totales</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(34,197,94,0.1); color: #22c55e;">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <div class="stat-number">${stats.porcentajeExito.toFixed(1)}%</div>
                <div class="stat-label-mini">Precisión</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(245,158,11,0.1); color: #f59e0b;">
                <i class="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <div class="stat-number">${stats.preguntasSinRespuesta}</div>
                <div class="stat-label-mini">Sin Respuesta</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(139,92,246,0.1); color: #8b5cf6;">
                <i class="fa-solid fa-thumbs-up"></i>
              </div>
              <div>
                <div class="stat-number">${porcentajeSatisfaccion}%</div>
                <div class="stat-label-mini">Satisfacción</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4 col-xl-2">
            <div class="stat-card-mini">
              <div class="stat-icon" style="background: rgba(20,184,166,0.1); color: #14b8a6;">
                <i class="fa-solid fa-chart-simple"></i>
              </div>
              <div>
                <div class="stat-number">${stats.promedioMensajesPorConversacion}</div>
                <div class="stat-label-mini">Msj/Conversación</div>
              </div>
            </div>
          </div>
        </div>

        <!-- GRID: TOP INTENCIONES + ACTIVIDAD -->
        <div class="row g-4 mb-4">
          
          <!-- TOP 10 INTENCIONES -->
          <div class="col-lg-6">
            <div class="card-admin">
              <div class="card-admin-header">
                <h2 class="card-admin-title">
                  <i class="fa-solid fa-ranking-star me-2 text-danger"></i>Top 10 Intenciones
                </h2>
              </div>
              <div class="card-admin-body">
                ${stats.topIntenciones.map((int, i) => `
                  <div class="top-intencion">
                    <div class="d-flex justify-content-between mb-1">
                      <span class="fw-semibold small">${i + 1}. ${int.intencion.replace('CONSULTAR_', '')}</span>
                      <span class="text-muted small">${int.total} (${int.porcentaje}%)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                      <div class="progress-bar" role="progressbar" 
                           style="width: ${(int.total * 100 / maxIntencion).toFixed(1)}%; background: linear-gradient(90deg, #c8102e, #dd3255);"
                           aria-valuenow="${int.total}" aria-valuemin="0" aria-valuemax="${maxIntencion}"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- ACTIVIDAD ÚLTIMOS 7 DÍAS -->
          <div class="col-lg-6">
            <div class="card-admin">
              <div class="card-admin-header">
                <h2 class="card-admin-title">
                  <i class="fa-solid fa-calendar-days me-2 text-danger"></i>Actividad de Mensajes
                </h2>
              </div>
              <div class="card-admin-body">
                <div class="actividad-chart">
                  ${stats.actividadUltimos7Dias.map(d => {
                    const porcentaje = (d.mensajes * 100 / maxActividad).toFixed(1);
                    const fecha = d.dia.split('-').reverse().slice(0, 2).join('/');
                    return `
                      <div class="actividad-row">
                        <div class="actividad-fecha">${fecha}</div>
                        <div class="actividad-bar-wrap">
                          <div class="actividad-bar" style="width: ${porcentaje}%;">
                            <span class="actividad-valor">${d.mensajes}</span>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PREGUNTAS PENDIENTES -->
        <div class="card-admin">
          <div class="card-admin-header d-flex justify-content-between align-items-center">
            <h2 class="card-admin-title mb-0">
              <i class="fa-solid fa-circle-question me-2 text-danger"></i>Preguntas sin Respuesta (${stats.preguntasSinRespuesta})
            </h2>
            <button id="verPendientesBtn" class="btn btn-admin-outline btn-sm">
              <i class="fa-solid fa-eye me-1"></i> Ver todas
            </button>
          </div>
          <div class="card-admin-body p-0">
            ${stats.preguntasPendientes.length === 0 ? `
              <div class="text-center py-4 text-muted">
                <i class="fa-solid fa-check-circle fa-2x mb-2 text-success"></i>
                <p class="mb-0">¡No hay preguntas pendientes!</p>
              </div>
            ` : `
              <div class="table-admin-wrap">
                <table class="table-admin">
                  <thead>
                    <tr>
                      <th style="width: 60px;">#</th>
                      <th>Pregunta</th>
                      <th style="width: 180px;">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stats.preguntasPendientes.map(p => `
                      <tr>
                        <td>#${p.id}</td>
                        <td><em class="text-secondary">"${p.pregunta}"</em></td>
                        <td><small class="text-muted">${p.fecha}</small></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      `;

      document.getElementById('verPendientesBtn')?.addEventListener('click', () => {
        navigate('chatbot');
        setTimeout(() => {
          const tabPendientes = document.getElementById('tabPendientes');
          if (tabPendientes) tabPendientes.click();
        }, 500);
      });

    } catch (err) {
      content.innerHTML = `
        <div class="alert alert-danger">
          <i class="fa-solid fa-exclamation-triangle me-2"></i>
          Error al cargar estadísticas: ${err.message}
        </div>
      `;
    }
  };

  document.getElementById('refreshStatsBtn').addEventListener('click', cargarEstadisticas);
  await cargarEstadisticas();
}

async function renderChatbot() {
  pageTitle.textContent = 'Chatbot DarBot';
  viewContainer.innerHTML = `
    <div class="admin-section">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 class="section-title mb-1">
            <i class="fa-solid fa-robot me-2 text-danger"></i>Gestión del Chatbot
          </h3>
          <p class="text-muted small mb-0">Administra las intenciones, FAQs, sinónimos y frases del chatbot.</p>
        </div>
      </div>

      <div class="card-admin">
        <div class="admin-tab-nav">
          <button id="tabIntenciones" class="admin-tab-btn active"><i class="fa-solid fa-brain me-2"></i>Intenciones</button>
          <button id="tabFaqs" class="admin-tab-btn"><i class="fa-solid fa-circle-question me-2"></i>FAQs</button>
          <button id="tabSinonimos" class="admin-tab-btn"><i class="fa-solid fa-language me-2"></i>Sinónimos</button>
          <button id="tabFrases" class="admin-tab-btn"><i class="fa-solid fa-quote-left me-2"></i>Frases</button>
          <button id="tabPendientes" class="admin-tab-btn">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>Pendientes
            <span id="badgePendientes" class="badge bg-danger ms-1 d-none">0</span>
          </button>
        </div>
        <div class="card-admin-body" id="chatbotInner">
          <div class="text-center py-4 text-muted">Cargando...</div>
        </div>
      </div>
    </div>
  `;

  const inner = document.getElementById('chatbotInner');
  const tabs = {
    intenciones: document.getElementById('tabIntenciones'),
    faqs: document.getElementById('tabFaqs'),
    sinonimos: document.getElementById('tabSinonimos'),
    frases: document.getElementById('tabFrases'),
    pendientes: document.getElementById('tabPendientes'),
  };

  const setTab = (active) => {
    Object.values(tabs).forEach(t => t.classList.remove('active'));
    active.classList.add('active');
  };

  // ═══════════════════════════════════════════════════════
  // INTENCIONES
  // ═══════════════════════════════════════════════════════
  const loadIntenciones = async () => {
    setTab(tabs.intenciones);
    inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando intenciones...</div>';
    try {
      const intents = await apiFetch('/admin/chatbot/intenciones');
      inner.innerHTML = `
        <div class="chatbot-help-banner">
          <div class="help-icon"><i class="fa-solid fa-lightbulb"></i></div>
          <div class="help-content">
            <h4>¿Qué es una intención?</h4>
            <p>Una <strong>intención</strong> es la categoría que el chatbot detecta cuando alguien escribe. Por ejemplo, si escriben "¿qué eventos hay?", se activa la intención <code>CONSULTAR_EVENTOS</code>.</p>
            <ul>
              <li><strong>Palabras clave:</strong> palabras que activan esta intención (🔑)</li>
              <li><strong>Prioridad:</strong> 1-10, mayor número = se evalúa primero</li>
              <li><strong>Respuesta por defecto:</strong> mensaje si no hay datos</li>
            </ul>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="h6 mb-0 fw-bold">Intenciones (${intents.length})</h4>
          <button id="crearIntencionBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Nueva Intención</button>
        </div>
        <div class="table-admin-wrap">
          <table class="table-admin">
            <thead>
              <tr>
                <th style="width:50px;">#</th>
                <th>Intención</th>
                <th style="width:100px;">Palabras</th>
                <th style="width:90px;">Prioridad</th>
                <th style="width:90px;">Estado</th>
                <th class="text-end" style="width:140px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${intents.map(i => `
                <tr>
                  <td>#${i.id}</td>
                  <td><strong>${i.nombre}</strong><br><small class="text-muted">${i.descripcion || ''}</small></td>
                  <td><span class="badge bg-secondary">${(i.palabrasClave || []).length}</span></td>
                  <td><span class="badge bg-primary">${i.prioridad}</span></td>
                  <td>${i.activa ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-info me-1 btn-ver-int" data-id="${i.id}" title="Ver palabras clave"><i class="fa-solid fa-key"></i></button>
                    <button class="btn btn-sm btn-primary me-1 btn-edit-int" data-id="${i.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger btn-del-int" data-id="${i.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('crearIntencionBtn').addEventListener('click', () => openIntencionModal());
      inner.querySelectorAll('.btn-edit-int').forEach(b => {
        b.addEventListener('click', () => openIntencionModal(parseInt(b.dataset.id, 10)));
      });
      inner.querySelectorAll('.btn-ver-int').forEach(b => {
        b.addEventListener('click', () => verPalabrasClave(parseInt(b.dataset.id, 10)));
      });
      inner.querySelectorAll('.btn-del-int').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta intención y todas sus palabras clave?')) return;
          try {
            await apiFetch(`/admin/chatbot/intenciones/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Intención eliminada');
            loadIntenciones();
          } catch (err) { alert(err.message); }
        });
      });
    } catch (e) { inner.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
  };

  const openIntencionModal = async (id = null) => {
    let int_ = { nombre: '', descripcion: '', prioridad: 5, activa: true, respuestaPorDefecto: '' };
    if (id) {
      try { int_ = await apiFetch(`/admin/chatbot/intenciones/${id}`); }
      catch (e) { alert('Error: ' + e.message); return; }
    }
    const html = `
      <h3><i class="fa-solid fa-brain me-2 text-danger"></i>${id ? 'Editar' : 'Nueva'} Intención</h3>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Nombre *
          <span class="help-tooltip" data-tip="El nombre único que identifica esta intención. Usa MAYÚSCULAS y guiones bajos.">?</span>
        </label>
        <input id="int_nombre" class="form-control" value="${int_.nombre || ''}" placeholder="Ej: CONSULTAR_BECAS"/>
        <div class="modal-example">
          💡 <strong>Ejemplos:</strong> <code>CONSULTAR_EVENTOS</code>, <code>CONSULTAR_NOTICIAS</code>, <code>CONSULTAR_BECAS</code>
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Descripción
          <span class="help-tooltip" data-tip="Explica brevemente qué tipo de preguntas activa esta intención. Ayuda a otros administradores a entenderla.">?</span>
        </label>
        <input id="int_descripcion" class="form-control" value="${int_.descripcion || ''}" placeholder="Ej: Consultas sobre becas y ayudas económicas"/>
        <div class="modal-example">
          💡 <strong>Ejemplo:</strong> "Consultas sobre becas, subsidios y apoyos económicos"
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Prioridad (1-10)
          <span class="help-tooltip" data-tip="Si dos intenciones coinciden, gana la de MAYOR prioridad. Usa 10 para intenciones críticas (saludo, matrícula) y 5 para las normales.">?</span>
        </label>
        <div class="d-flex align-items-center gap-2">
          <input id="int_prioridad" type="number" class="form-control" value="${int_.prioridad || 5}" min="1" max="10" style="max-width:100px;"/>
          <div class="peso-indicator" id="prioridad_indicator">
            <span class="dot active-1"></span>
            <span class="dot active-2"></span>
            <span class="dot active-3"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span class="text-muted small" id="prioridad_label">Normal</span>
        </div>
        <div class="modal-example">
          💡 <strong>Guía:</strong> 9-10 = Crítica | 6-8 = Importante | 3-5 = Normal | 1-2 = Poco frecuente
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Respuesta por defecto
          <span class="help-tooltip" data-tip="Mensaje que se envía si la intención se detecta pero no hay datos disponibles. Opcional.">?</span>
        </label>
        <textarea id="int_respuesta" class="form-control" rows="2" placeholder="Ej: Lo siento, no hay becas disponibles actualmente.">${int_.respuestaPorDefecto || ''}</textarea>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="int_activa" type="checkbox" ${int_.activa !== false ? 'checked' : ''}/> 
          Activa
          <span class="help-tooltip" data-tip="Si está desmarcada, el chatbot no usará esta intención.">?</span>
        </label>
      </div>
      
      <div class="modal-actions">
        <button id="int_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="int_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);
    
    // Listener para el indicador de prioridad
    const prioridadInput = overlay.querySelector('#int_prioridad');
    const prioridadIndicator = overlay.querySelector('#prioridad_indicator');
    const prioridadLabel = overlay.querySelector('#prioridad_label');
    const actualizarIndicador = () => {
      const val = parseInt(prioridadInput.value || '5', 10);
      const dots = prioridadIndicator.querySelectorAll('.dot');
      dots.forEach((dot, i) => {
        dot.className = 'dot';
        if (i < Math.ceil(val / 2)) {
          const level = Math.min(5, Math.ceil(val / 2));
          dot.classList.add(`active-${level}`);
        }
      });
      if (val >= 9) prioridadLabel.textContent = 'Crítica';
      else if (val >= 6) prioridadLabel.textContent = 'Importante';
      else if (val >= 3) prioridadLabel.textContent = 'Normal';
      else prioridadLabel.textContent = 'Poco frecuente';
    };
    prioridadInput.addEventListener('input', actualizarIndicador);
    actualizarIndicador();
    
    overlay.querySelector('#int_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#int_submit').addEventListener('click', async () => {
      const payload = {
        nombre: overlay.querySelector('#int_nombre').value.trim(),
        descripcion: overlay.querySelector('#int_descripcion').value.trim(),
        prioridad: parseInt(overlay.querySelector('#int_prioridad').value || '5', 10),
        respuestaPorDefecto: overlay.querySelector('#int_respuesta').value.trim(),
        activa: overlay.querySelector('#int_activa').checked
      };
      if (!payload.nombre) return alert('El nombre es obligatorio');
      try {
        if (id) await apiFetch(`/admin/chatbot/intenciones/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await apiFetch('/admin/chatbot/intenciones', { method: 'POST', body: JSON.stringify(payload) });
        closeModal(overlay);
        showToast(id ? 'Intención actualizada' : 'Intención creada');
        loadIntenciones();
      } catch (e) { alert('Error: ' + e.message); }
    });
  };

  const verPalabrasClave = async (id) => {
    try {
      const int_ = await apiFetch(`/admin/chatbot/intenciones/${id}`);
      const palabras = int_.palabrasClave || [];
      const html = `
        <h3><i class="fa-solid fa-key me-2 text-danger"></i>Palabras clave: ${int_.nombre}</h3>
        
        <div class="chatbot-help-banner" style="padding:12px 16px;margin-bottom:16px;">
          <div class="help-icon" style="width:32px;height:32px;font-size:0.9rem;"><i class="fa-solid fa-info"></i></div>
          <div class="help-content">
            <p style="font-size:0.82rem;">Estas palabras activan la intención <strong>${int_.nombre}</strong> cuando el usuario las escribe. A mayor peso, más fácil será detectar la intención.</p>
          </div>
        </div>
        
        <div class="form-row mb-3">
          <label class="fw-semibold">Agregar nueva palabra</label>
          <div class="input-group">
            <input id="nueva_palabra" class="form-control" placeholder="Ej: beca, becas, ayuda económica"/>
            <input id="nuevo_peso" type="number" class="form-control" style="max-width:80px;" value="5" min="1" max="10"/>
            <button id="add_palabra" class="btn btn-admin-primary" type="button"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        
        <div class="modal-example mb-3">
          💡 <strong>Guía de peso:</strong><br>
          <span class="badge bg-success">1-2</span> Normal (ej: "beca") &nbsp;
          <span class="badge bg-warning">3-4</span> Importante &nbsp;
          <span class="badge bg-danger">5+</span> Crítico (ej: "quiero una beca")
        </div>
        
        <div style="max-height:280px;overflow-y:auto;">
          <table class="table-admin">
            <thead><tr><th>Palabra</th><th style="width:80px;">Peso</th><th style="width:60px;"></th></tr></thead>
            <tbody>
              ${palabras.map(p => {
                let badge = 'bg-secondary';
                if (p.peso >= 5) badge = 'bg-danger';
                else if (p.peso >= 3) badge = 'bg-warning text-dark';
                else if (p.peso >= 1) badge = 'bg-success';
                return `
                  <tr>
                    <td>${p.palabra}</td>
                    <td><span class="badge ${badge}">${p.peso}</span></td>
                    <td><button class="btn btn-sm btn-danger btn-del-palabra" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button></td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="3" class="text-center text-muted py-3">Sin palabras clave</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <div class="modal-actions">
          <button id="pal_cancel" class="btn btn-admin-outline">Cerrar</button>
        </div>
      `;
      const overlay = showModal(html);
      overlay.querySelector('#pal_cancel').addEventListener('click', () => closeModal(overlay));
      overlay.querySelector('#add_palabra').addEventListener('click', async () => {
        const palabra = overlay.querySelector('#nueva_palabra').value.trim();
        const peso = parseInt(overlay.querySelector('#nuevo_peso').value || '1', 10);
        if (!palabra) return alert('Escribe una palabra');
        try {
          await apiFetch(`/admin/chatbot/intenciones/${id}/palabras-clave`, {
            method: 'POST',
            body: JSON.stringify({ palabra, peso })
          });
          showToast('Palabra agregada');
          closeModal(overlay);
          verPalabrasClave(id);
        } catch (e) { alert(e.message); }
      });
      overlay.querySelectorAll('.btn-del-palabra').forEach(b => {
        b.addEventListener('click', async () => {
          try {
            await apiFetch(`/admin/chatbot/palabras-clave/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Palabra eliminada');
            closeModal(overlay);
            verPalabrasClave(id);
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ═══════════════════════════════════════════════════════
  // FAQs
  // ═══════════════════════════════════════════════════════
  const loadFaqs = async () => {
    setTab(tabs.faqs);
    inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando FAQs...</div>';
    try {
      const faqs = await apiFetch('/admin/chatbot/faqs');
      inner.innerHTML = `
        <div class="chatbot-help-banner">
          <div class="help-icon"><i class="fa-solid fa-circle-question"></i></div>
          <div class="help-content">
            <h4>¿Qué es una FAQ?</h4>
            <p>Una <strong>FAQ</strong> (Pregunta Frecuente) es una pregunta con su respuesta directa. Se usa cuando el usuario pregunta algo específico que <em>no</em> encaja en una intención general.</p>
            <ul>
              <li><strong>Pregunta:</strong> tal como la escribiría el usuario</li>
              <li><strong>Respuesta:</strong> información completa y clara</li>
              <li><strong>Categoría:</strong> para organizar (Horarios, Admisiones, etc.)</li>
            </ul>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="h6 mb-0 fw-bold">FAQs (${faqs.length})</h4>
          <button id="crearFaqBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Nueva FAQ</button>
        </div>
        <div class="table-admin-wrap">
          <table class="table-admin">
            <thead><tr>
              <th style="width:50px;">#</th><th>Pregunta</th><th>Categoría</th><th style="width:80px;">Activa</th>
              <th class="text-end" style="width:140px;">Acciones</th>
            </tr></thead>
            <tbody>
              ${faqs.map(f => `
                <tr>
                  <td>#${f.id}</td>
                  <td><strong>${f.pregunta}</strong><br><small class="text-muted">${(f.respuesta || '').substring(0, 80)}...</small></td>
                  <td><span class="badge bg-secondary">${f.categoria || 'General'}</span></td>
                  <td>${f.activa ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-primary me-1 btn-edit-faq" data-id="${f.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger btn-del-faq" data-id="${f.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('crearFaqBtn').addEventListener('click', () => openFaqModal());
      inner.querySelectorAll('.btn-edit-faq').forEach(b => {
        b.addEventListener('click', () => openFaqModal(parseInt(b.dataset.id, 10), faqs));
      });
      inner.querySelectorAll('.btn-del-faq').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta FAQ?')) return;
          try {
            await apiFetch(`/admin/chatbot/faqs/${b.dataset.id}`, { method: 'DELETE' });
            showToast('FAQ eliminada');
            loadFaqs();
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { inner.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
  };

  const openFaqModal = (id = null, faqs = []) => {
    let faq = { pregunta: '', respuesta: '', categoria: 'General', activa: true };
    if (id) {
      faq = faqs.find(f => f.id === id) || faq;
    }
    const html = `
      <h3><i class="fa-solid fa-circle-question me-2 text-danger"></i>${id ? 'Editar' : 'Nueva'} FAQ</h3>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Pregunta *
          <span class="help-tooltip" data-tip="Escribe la pregunta tal como la haría un usuario. El chatbot buscará similitudes.">?</span>
        </label>
        <input id="faq_pregunta" class="form-control" value="${faq.pregunta || ''}" placeholder="Ej: ¿Tienen programa de becas?"/>
        <div class="modal-example">
          💡 <strong>Ejemplos:</strong> "¿Cuál es el horario?", "¿Cómo me inscribo?", "¿Dónde queda el colegio?"
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Respuesta *
          <span class="help-tooltip" data-tip="Respuesta clara y completa. Incluye toda la información relevante.">?</span>
        </label>
        <textarea id="faq_respuesta" class="form-control" rows="4" placeholder="Escribe la respuesta completa aquí...">${faq.respuesta || ''}</textarea>
        <div class="modal-example">
          💡 <strong>Tip:</strong> Si es un horario, incluye días y horas. Si es un contacto, incluye teléfono y correo.
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Categoría
          <span class="help-tooltip" data-tip="Sirve para organizar las FAQs. Ejemplos: Horarios, Admisiones, Ubicación, Contacto, Becas.">?</span>
        </label>
        <input id="faq_categoria" class="form-control" value="${faq.categoria || 'General'}" list="categorias_faq"/>
        <datalist id="categorias_faq">
          <option value="General">
          <option value="Horarios">
          <option value="Admisiones">
          <option value="Ubicación">
          <option value="Contacto">
          <option value="Becas">
          <option value="Servicios">
        </datalist>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="faq_activa" type="checkbox" ${faq.activa !== false ? 'checked' : ''}/> 
          Activa
          <span class="help-tooltip" data-tip="Si está desmarcada, el chatbot no usará esta FAQ.">?</span>
        </label>
      </div>
      
      <div class="modal-actions">
        <button id="faq_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="faq_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);
    overlay.querySelector('#faq_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#faq_submit').addEventListener('click', async () => {
      const payload = {
        pregunta: overlay.querySelector('#faq_pregunta').value.trim(),
        respuesta: overlay.querySelector('#faq_respuesta').value.trim(),
        categoria: overlay.querySelector('#faq_categoria').value.trim(),
        activa: overlay.querySelector('#faq_activa').checked
      };
      if (!payload.pregunta || !payload.respuesta) return alert('Pregunta y respuesta son obligatorias');
      try {
        if (id) await apiFetch(`/admin/chatbot/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await apiFetch('/admin/chatbot/faqs', { method: 'POST', body: JSON.stringify(payload) });
        closeModal(overlay);
        showToast(id ? 'FAQ actualizada' : 'FAQ creada');
        loadFaqs();
      } catch (e) { alert('Error: ' + e.message); }
    });
  };

  // ═══════════════════════════════════════════════════════
  // SINÓNIMOS
  // ═══════════════════════════════════════════════════════
  const loadSinonimos = async () => {
    setTab(tabs.sinonimos);
    inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando sinónimos...</div>';
    try {
      const sinonimos = await apiFetch('/admin/chatbot/sinonimos');
      inner.innerHTML = `
        <div class="chatbot-help-banner">
          <div class="help-icon"><i class="fa-solid fa-language"></i></div>
          <div class="help-content">
            <h4>¿Qué es un sinónimo?</h4>
            <p>Un <strong>sinónimo</strong> permite que el chatbot entienda diferentes formas de decir lo mismo. Por ejemplo: "evento" y "acto" significan lo mismo.</p>
            <ul>
              <li><strong>Palabra base:</strong> la palabra principal (ej: <code>evento</code>)</li>
              <li><strong>Sinónimo:</strong> la variación (ej: <code>acto</code>, <code>feriado</code>)</li>
              <li><strong>Intención:</strong> opcional, la categoría a la que pertenece</li>
            </ul>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="h6 mb-0 fw-bold">Sinónimos (${sinonimos.length})</h4>
          <button id="crearSinBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Nuevo Sinónimo</button>
        </div>
        <div class="table-admin-wrap">
          <table class="table-admin">
            <thead><tr>
              <th style="width:50px;">#</th><th>Palabra base</th><th>Sinónimo</th><th>Intención</th>
              <th style="width:80px;">Activa</th><th class="text-end" style="width:140px;">Acciones</th>
            </tr></thead>
            <tbody>
              ${sinonimos.map(s => `
                <tr>
                  <td>#${s.id}</td>
                  <td><strong>${s.palabraBase}</strong></td>
                  <td>${s.sinonimo}</td>
                  <td>${s.intencionNombre ? `<span class="badge bg-secondary">${s.intencionNombre}</span>` : '—'}</td>
                  <td>${s.activa ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-primary me-1 btn-edit-sin" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger btn-del-sin" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('crearSinBtn').addEventListener('click', () => openSinonimoModal(null, sinonimos));
      inner.querySelectorAll('.btn-edit-sin').forEach(b => {
        b.addEventListener('click', () => openSinonimoModal(parseInt(b.dataset.id, 10), sinonimos));
      });
      inner.querySelectorAll('.btn-del-sin').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar este sinónimo?')) return;
          try {
            await apiFetch(`/admin/chatbot/sinonimos/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Sinónimo eliminado');
            loadSinonimos();
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { inner.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
  };

  const openSinonimoModal = async (id = null, sinonimos = []) => {
    let sin = { palabraBase: '', sinonimo: '', intencionId: null, activa: true };
    if (id) {
      sin = sinonimos.find(s => s.id === id) || sin;
    }
    
    // Cargar intenciones para el select
    let intenciones = [];
    try { intenciones = await apiFetch('/admin/chatbot/intenciones'); } catch (e) {}
    
    const html = `
      <h3><i class="fa-solid fa-language me-2 text-danger"></i>${id ? 'Editar' : 'Nuevo'} Sinónimo</h3>
      
      <div class="chatbot-help-banner" style="padding:12px 16px;margin-bottom:16px;">
        <div class="help-icon" style="width:32px;height:32px;font-size:0.9rem;"><i class="fa-solid fa-info"></i></div>
        <div class="help-content">
          <p style="font-size:0.82rem;">Los sinónimos permiten que el chatbot entienda diferentes formas de decir lo mismo. Por ejemplo, si dices "acto", el chatbot sabrá que te refieres a "evento".</p>
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Palabra base *
          <span class="help-tooltip" data-tip="La palabra principal o canónica. Generalmente es la que ya existe en las palabras clave.">?</span>
        </label>
        <input id="sin_base" class="form-control" value="${sin.palabraBase || ''}" placeholder="Ej: evento"/>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Sinónimo *
          <span class="help-tooltip" data-tip="La variación o palabra alternativa que el usuario podría escribir.">?</span>
        </label>
        <input id="sin_sinonimo" class="form-control" value="${sin.sinonimo || ''}" placeholder="Ej: acto, feriado, encuentro"/>
        <div class="modal-example">
          💡 <strong>Ejemplo completo:</strong> "evento" → "acto", "feriado", "encuentro"
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Intención asociada
          <span class="help-tooltip" data-tip="Opcional. Si lo asocias a una intención, el sinónimo ayudará a detectarla mejor.">?</span>
        </label>
        <select id="sin_intencion" class="form-control">
          <option value="">-- Ninguna --</option>
          ${intenciones.map(i => `<option value="${i.id}" ${i.id === sin.intencionId ? 'selected' : ''}>${i.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="sin_activa" type="checkbox" ${sin.activa !== false ? 'checked' : ''}/> Activa
        </label>
      </div>
      
      <div class="modal-actions">
        <button id="sin_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="sin_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);
    overlay.querySelector('#sin_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#sin_submit').addEventListener('click', async () => {
      const intencionVal = overlay.querySelector('#sin_intencion').value;
      const payload = {
        palabraBase: overlay.querySelector('#sin_base').value.trim(),
        sinonimo: overlay.querySelector('#sin_sinonimo').value.trim(),
        intencionId: intencionVal ? parseInt(intencionVal, 10) : null,
        activa: overlay.querySelector('#sin_activa').checked
      };
      if (!payload.palabraBase || !payload.sinonimo) return alert('Palabra base y sinónimo son obligatorios');
      try {
        if (id) await apiFetch(`/admin/chatbot/sinonimos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await apiFetch('/admin/chatbot/sinonimos', { method: 'POST', body: JSON.stringify(payload) });
        closeModal(overlay);
        showToast(id ? 'Sinónimo actualizado' : 'Sinónimo creado');
        loadSinonimos();
      } catch (e) { alert('Error: ' + e.message); }
    });
  };

  // ═══════════════════════════════════════════════════════
  // FRASES ESPECÍFICAS
  // ═══════════════════════════════════════════════════════
  const loadFrases = async () => {
    setTab(tabs.frases);
    inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando frases...</div>';
    try {
      const frases = await apiFetch('/admin/chatbot/frases');
      inner.innerHTML = `
        <div class="chatbot-help-banner">
          <div class="help-icon"><i class="fa-solid fa-quote-left"></i></div>
          <div class="help-content">
            <h4>¿Qué es una frase específica?</h4>
            <p>Una <strong>frase específica</strong> es una coincidencia exacta. Si el usuario escribe <em>literalmente</em> esa frase, se activa la intención sin importar las palabras clave.</p>
            <ul>
              <li><strong>Frase:</strong> texto exacto (ej: <code>qué hay de comer</code>)</li>
              <li><strong>Peso:</strong> mayor número = se verifica primero (10 = prioridad alta)</li>
              <li>Útil para frases compuestas o modismos</li>
            </ul>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="h6 mb-0 fw-bold">Frases específicas (${frases.length})</h4>
          <button id="crearFraseBtn" class="btn btn-admin-primary btn-sm"><i class="fa-solid fa-plus me-1"></i> Nueva Frase</button>
        </div>
        <div class="table-admin-wrap">
          <table class="table-admin">
            <thead><tr>
              <th style="width:50px;">#</th><th>Frase</th><th>Intención</th>
              <th style="width:70px;">Peso</th><th style="width:80px;">Activa</th>
              <th class="text-end" style="width:140px;">Acciones</th>
            </tr></thead>
            <tbody>
              ${frases.map(f => `
                <tr>
                  <td>#${f.id}</td>
                  <td><strong>"${f.frase}"</strong></td>
                  <td><span class="badge bg-secondary">${f.intencionNombre}</span></td>
                  <td><span class="badge bg-primary">${f.peso}</span></td>
                  <td>${f.activa ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>'}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-primary me-1 btn-edit-frase" data-id="${f.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger btn-del-frase" data-id="${f.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('crearFraseBtn').addEventListener('click', () => openFraseModal(null, frases));
      inner.querySelectorAll('.btn-edit-frase').forEach(b => {
        b.addEventListener('click', () => openFraseModal(parseInt(b.dataset.id, 10), frases));
      });
      inner.querySelectorAll('.btn-del-frase').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta frase?')) return;
          try {
            await apiFetch(`/admin/chatbot/frases/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Frase eliminada');
            loadFrases();
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { inner.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
  };

  const openFraseModal = async (id = null, frases = []) => {
    let frase = { frase: '', intencionId: null, peso: 10, activa: true };
    if (id) {
      frase = frases.find(f => f.id === id) || frase;
    }
    
    let intenciones = [];
    try { intenciones = await apiFetch('/admin/chatbot/intenciones'); } catch (e) {}
    
    const html = `
      <h3><i class="fa-solid fa-quote-left me-2 text-danger"></i>${id ? 'Editar' : 'Nueva'} Frase</h3>
      
      <div class="chatbot-help-banner" style="padding:12px 16px;margin-bottom:16px;">
        <div class="help-icon" style="width:32px;height:32px;font-size:0.9rem;"><i class="fa-solid fa-info"></i></div>
        <div class="help-content">
          <p style="font-size:0.82rem;">Las frases específicas son <strong>coincidencias exactas</strong>. Si el usuario escribe esta frase literalmente, se activa la intención sin importar las palabras clave.</p>
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Frase exacta *
          <span class="help-tooltip" data-tip="El texto exacto que el usuario debe escribir. Se normalizan tildes y mayúsculas.">?</span>
        </label>
        <input id="frase_texto" class="form-control" value="${frase.frase || ''}" placeholder="Ej: qué hay de comer"/>
        <div class="modal-example">
          💡 <strong>Ejemplos:</strong> "qué hay de comer", "teléfono de la institución", "necesito el manual"
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Intención *
          <span class="help-tooltip" data-tip="La intención que se activará cuando el usuario escriba esta frase.">?</span>
        </label>
        <select id="frase_intencion" class="form-control">
          <option value="">-- Seleccionar --</option>
          ${intenciones.map(i => `<option value="${i.id}" ${i.id === frase.intencionId ? 'selected' : ''}>${i.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Peso
          <span class="help-tooltip" data-tip="A mayor peso, mayor prioridad sobre otras frases. Usa 10 para frases importantes y 5 para las normales.">?</span>
        </label>
        <input id="frase_peso" type="number" class="form-control" value="${frase.peso || 10}" min="1" max="100" style="max-width:120px;"/>
        <div class="modal-example">
          💡 <strong>Guía:</strong> 20+ = Crítica | 10-19 = Importante | 1-9 = Normal
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold d-block">
          <input id="frase_activa" type="checkbox" ${frase.activa !== false ? 'checked' : ''}/> Activa
        </label>
      </div>
      
      <div class="modal-actions">
        <button id="frase_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="frase_submit" class="btn btn-admin-primary">${id ? 'Guardar' : 'Crear'}</button>
      </div>
    `;
    const overlay = showModal(html);
    overlay.querySelector('#frase_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#frase_submit').addEventListener('click', async () => {
      const intencionVal = overlay.querySelector('#frase_intencion').value;
      if (!intencionVal) return alert('Selecciona una intención');
      const payload = {
        frase: overlay.querySelector('#frase_texto').value.trim(),
        intencionId: parseInt(intencionVal, 10),
        peso: parseInt(overlay.querySelector('#frase_peso').value || '10', 10),
        activa: overlay.querySelector('#frase_activa').checked
      };
      if (!payload.frase) return alert('La frase es obligatoria');
      try {
        if (id) await apiFetch(`/admin/chatbot/frases/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await apiFetch('/admin/chatbot/frases', { method: 'POST', body: JSON.stringify(payload) });
        closeModal(overlay);
        showToast(id ? 'Frase actualizada' : 'Frase creada');
        loadFrases();
      } catch (e) { alert('Error: ' + e.message); }
    });
  };

  // ═══════════════════════════════════════════════════════
  // PREGUNTAS SIN RESPUESTA
  // ═══════════════════════════════════════════════════════
  const loadPendientes = async () => {
    setTab(tabs.pendientes);
    inner.innerHTML = '<div class="text-center py-4 text-muted">Cargando preguntas pendientes...</div>';
    try {
      const pendientes = await apiFetch('/admin/chatbot/preguntas?resuelta=false');
      
      // Actualizar badge
      const badge = document.getElementById('badgePendientes');
      if (pendientes.length > 0) {
        badge.textContent = pendientes.length;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
      
      inner.innerHTML = `
        <div class="chatbot-help-banner">
          <div class="help-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="help-content">
            <h4>Preguntas sin respuesta</h4>
            <p>Aquí se guardan las preguntas que el chatbot <strong>no pudo responder</strong>. Revísalas periódicamente y conviértelas en FAQs para mejorar el chatbot.</p>
            <ul>
              <li>🎯 <strong>Convertir a FAQ:</strong> crea una respuesta para esa pregunta</li>
              <li>✅ <strong>Marcar resuelta:</strong> si ya la resolviste manualmente</li>
              <li>🗑 <strong>Eliminar:</strong> si no es relevante</li>
            </ul>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="h6 mb-0 fw-bold">Preguntas sin respuesta (${pendientes.length})</h4>
        </div>
        ${pendientes.length === 0 ? '<div class="alert alert-success">🎉 ¡No hay preguntas pendientes!</div>' : `
        <div class="table-admin-wrap">
          <table class="table-admin">
            <thead><tr>
              <th style="width:50px;">#</th><th>Pregunta</th><th>Fecha</th>
              <th class="text-end" style="width:260px;">Acciones</th>
            </tr></thead>
            <tbody>
              ${pendientes.map(p => `
                <tr>
                  <td>#${p.id}</td>
                  <td><strong>${p.pregunta}</strong></td>
                  <td><small class="text-muted">${p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : ''}</small></td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-success me-1 btn-conv-faq" data-id="${p.id}" data-pregunta="${p.pregunta.replace(/"/g, '&quot;')}"><i class="fa-solid fa-arrow-right me-1"></i>Convertir a FAQ</button>
                    <button class="btn btn-sm btn-outline-secondary me-1 btn-resolver" data-id="${p.id}"><i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-sm btn-danger btn-del-pend" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        `}
      `;
      
      inner.querySelectorAll('.btn-conv-faq').forEach(b => {
        b.addEventListener('click', () => openConvertirFaqModal(parseInt(b.dataset.id, 10), b.dataset.pregunta));
      });
      inner.querySelectorAll('.btn-resolver').forEach(b => {
        b.addEventListener('click', async () => {
          try {
            await apiFetch(`/admin/chatbot/preguntas/${b.dataset.id}/resolver`, { method: 'PUT' });
            showToast('Marcada como resuelta');
            loadPendientes();
          } catch (e) { alert(e.message); }
        });
      });
      inner.querySelectorAll('.btn-del-pend').forEach(b => {
        b.addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta pregunta?')) return;
          try {
            await apiFetch(`/admin/chatbot/preguntas/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Pregunta eliminada');
            loadPendientes();
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { inner.innerHTML = `<div class="alert alert-danger">${e.message}</div>`; }
  };

  const openConvertirFaqModal = async (id, pregunta) => {
    const html = `
      <h3><i class="fa-solid fa-arrow-right me-2 text-danger"></i>Convertir a FAQ</h3>
      
      <div class="chatbot-help-banner" style="padding:12px 16px;margin-bottom:16px;">
        <div class="help-icon" style="width:32px;height:32px;font-size:0.9rem;"><i class="fa-solid fa-lightbulb"></i></div>
        <div class="help-content">
          <p style="font-size:0.82rem;">Vas a crear una FAQ con esta pregunta. Escribe una respuesta clara y completa para que el chatbot pueda responder en el futuro.</p>
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">Pregunta (del usuario)</label>
        <div class="form-control" style="background:#f9fafb;color:#6b7280;font-style:italic;">
          "${pregunta}"
        </div>
      </div>
      
      <div class="form-row mb-3">
        <label class="fw-semibold">
          Respuesta *
          <span class="help-tooltip" data-tip="Escribe una respuesta completa. Incluye toda la información que el usuario necesita saber.">?</span>
        </label>
        <textarea id="conv_respuesta" class="form-control" rows="6" placeholder="Escribe la respuesta que quieres que dé el chatbot..."></textarea>
        <div class="modal-example">
          💡 <strong>Tip:</strong> Sé específico. Si aplica, incluye teléfonos, correos, horarios o pasos a seguir.
        </div>
      </div>
      
      <div class="modal-actions">
        <button id="conv_cancel" class="btn btn-admin-outline">Cancelar</button>
        <button id="conv_submit" class="btn btn-admin-primary"><i class="fa-solid fa-check me-1"></i> Convertir a FAQ</button>
      </div>
    `;
    const overlay = showModal(html);
    overlay.querySelector('#conv_cancel').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#conv_submit').addEventListener('click', async () => {
      const respuesta = overlay.querySelector('#conv_respuesta').value.trim();
      if (!respuesta) return alert('Escribe una respuesta');
      try {
        await apiFetch(`/admin/chatbot/preguntas/${id}/convertir-faq?respuesta=${encodeURIComponent(respuesta)}`, { method: 'POST' });
        closeModal(overlay);
        showToast('FAQ creada desde pregunta pendiente');
        loadPendientes();
      } catch (e) { alert('Error: ' + e.message); }
    });
  };

  // ═══════════════════════════════════════════════════════
  // EVENT LISTENERS DE TABS
  // ═══════════════════════════════════════════════════════
  tabs.intenciones.addEventListener('click', loadIntenciones);
  tabs.faqs.addEventListener('click', loadFaqs);
  tabs.sinonimos.addEventListener('click', loadSinonimos);
  tabs.frases.addEventListener('click', loadFrases);
  tabs.pendientes.addEventListener('click', loadPendientes);

  // Cargar badge de pendientes y la primera tab
  loadIntenciones();
  (async () => {
    try {
      const pendientes = await apiFetch('/admin/chatbot/preguntas?resuelta=false');
      const badge = document.getElementById('badgePendientes');
      if (badge && pendientes.length > 0) {
        badge.textContent = pendientes.length;
        badge.classList.remove('d-none');
      }
    } catch (e) {}
  })();
}


  // ---------- CACHE ----------
  async function renderCache() {
    pageTitle.textContent = 'Gestión de Caché';
    viewContainer.innerHTML = `
      <div class="card-admin">
        <div class="card-admin-header">
          <h2 class="card-admin-title"><i class="fa-solid fa-memory me-2 text-danger"></i>Limpieza de Memoria Caché</h2>
        </div>
        <div class="card-admin-body">
          <p class="text-muted mb-4">Si has realizado cambios en las intenciones o en la base de conocimientos, puedes limpiar la caché para que el chatbot responda con los datos más recientes.</p>
          <div class="d-flex gap-3">
            <button id="btnEvictIntenciones" class="btn btn-admin-primary">
              <i class="fa-solid fa-trash-arrow-up me-2"></i> Limpiar Caché de Intenciones
            </button>
            <button id="btnEvictFaqs" class="btn btn-admin-outline">
              <i class="fa-solid fa-broom me-2"></i> Limpiar Caché de FAQs
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEvictIntenciones').addEventListener('click', async () => {
      try {
        await apiFetch('/admin/cache/intenciones', { method: 'DELETE' });
        showToast('Caché de intenciones purgada con éxito');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('btnEvictFaqs').addEventListener('click', async () => {
      try {
        await apiFetch('/admin/cache/faqs', { method: 'DELETE' });
        showToast('Caché de FAQs purgada con éxito');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Init
  loadCurrentUser().then(() => {
    // Inicializar sidebar mejorada
    if (typeof inicializarSidebarMejorada === 'function') {
      inicializarSidebarMejorada();
    }
    
    // Cargar notificaciones
    if (typeof cargarNotificaciones === 'function') {
      cargarNotificaciones();
      setInterval(cargarNotificaciones, 60000);
    }
    
    // Inicializar listeners del topbar
    if (typeof inicializarTopbarListeners === 'function') {
      inicializarTopbarListeners();
    }
    
    navigate('dashboard');
  });
}


