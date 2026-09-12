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
    sidebarToggleBtn.addEventListener('click', () => {
      adminSidebar.classList.toggle('open');
    });
  }

  // --- Router handler ---
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
      case 'usuarios': renderUsuarios(); break;
      case 'contenidos': renderContenidos(); break;
      case 'institucional': renderInstitucional(); break;
      case 'chatbot': renderChatbot(); break;
      case 'cache': renderCache(); break;
      case 'galeria': renderGaleria(); break;
      case 'estadisticas': renderEstadisticas(); break;
      case 'equipo': renderEquipo(); break;
      case 'valores': renderValores(); break;
      case 'servicios': renderServicios(); break;
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
      <div class="row g-4 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="fa-solid fa-users"></i></div>
            <div>
              <div class="kpi-number" id="dashUsersCount">-</div>
              <div class="kpi-label">Usuarios Registrados</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="fa-solid fa-newspaper"></i></div>
            <div>
              <div class="kpi-number" id="dashNewsCount">-</div>
              <div class="kpi-label">Noticias Publicadas</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="fa-solid fa-calendar-check"></i></div>
            <div>
              <div class="kpi-number" id="dashEventsCount">-</div>
              <div class="kpi-label">Eventos Registrados</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="fa-solid fa-robot"></i></div>
            <div>
              <div class="kpi-number" id="dashFaqsCount">-</div>
              <div class="kpi-label">FAQs del Chatbot</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title"><i class="fa-solid fa-rocket me-2 text-danger"></i>Accesos Rápidos</h2>
            </div>
            <div class="card-admin-body">
              <div class="row g-3">
                <div class="col-sm-6">
                  <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=usuarios]').click()">
                    <i class="fa-solid fa-user-plus text-danger fs-4"></i>
                    <div>
                      <strong class="d-block">Gestión de Usuarios</strong>
                      <small class="text-muted">Crear y administrar cuentas y roles</small>
                    </div>
                  </button>
                </div>
                <div class="col-sm-6">
                  <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=contenidos]').click()">
                    <i class="fa-solid fa-pen-to-square text-danger fs-4"></i>
                    <div>
                      <strong class="d-block">Publicar Contenidos</strong>
                      <small class="text-muted">Noticias, eventos y documentos</small>
                    </div>
                  </button>
                </div>
                <div class="col-sm-6">
                  <button class="btn btn-admin-outline w-100 p-3 text-start d-flex align-items-center gap-3" onclick="document.querySelector('[data-route=chatbot]').click()">
                    <i class="fa-solid fa-comments text-danger fs-4"></i>
                    <div>
                      <strong class="d-block">Entrenar Chatbot</strong>
                      <small class="text-muted">Ajustar intenciones y preguntas</small>
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

        <div class="col-lg-4">
          <div class="card-admin">
            <div class="card-admin-header">
              <h2 class="card-admin-title"><i class="fa-solid fa-shield-heart me-2 text-success"></i>Estado del Sistema</h2>
            </div>
            <div class="card-admin-body">
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <span class="text-muted small">Servidor API</span>
                <span class="status-pill active">Operacional</span>
              </div>
              <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <span class="text-muted small">Base de Datos</span>
                <span class="status-pill active">Conectada</span>
              </div>
              <div class="d-flex align-items-center justify-content-between">
                <span class="text-muted small">Motor de Chatbot</span>
                <span class="status-pill active">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load Metrics
    try {
      const [users, news, events, faqs] = await Promise.all([
        apiFetch('/admin/usuarios').catch(() => []),
        apiFetch('/admin/contenidos/noticias').catch(() => []),
        apiFetch('/admin/contenidos/eventos').catch(() => []),
        apiFetch('/admin/chatbot/faqs').catch(() => [])
      ]);

      const uEl = document.getElementById('dashUsersCount'); if (uEl) uEl.textContent = users.length;
      const nEl = document.getElementById('dashNewsCount'); if (nEl) nEl.textContent = news.length;
      const eEl = document.getElementById('dashEventsCount'); if (eEl) eEl.textContent = events.length;
      const fEl = document.getElementById('dashFaqsCount'); if (fEl) fEl.textContent = faqs.length;
    } catch (e) {
      console.warn('Metrics failed', e);
    }
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
  async function renderInstitucional() {
    pageTitle.textContent = 'Información Institucional';
    viewContainer.innerHTML = `
      <div class="card-admin">
        <div class="card-admin-header">
          <h2 class="card-admin-title"><i class="fa-solid fa-landmark me-2 text-danger"></i>Sedes y Contactos</h2>
        </div>
        <div class="card-admin-body">
          <p class="text-muted">Administra las sedes principales, las áreas de atención y los canales institucionales.</p>
        </div>
      </div>
    `;
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

  async function renderChatbot() {
    pageTitle.textContent = 'Chatbot DarBot';
    viewContainer.innerHTML = `
      <div class="card-admin">
        <div class="admin-tab-nav">
          <button id="tabIntenciones" class="admin-tab-btn active"><i class="fa-solid fa-brain me-2"></i>Intenciones</button>
          <button id="tabFaqs" class="admin-tab-btn"><i class="fa-solid fa-circle-question me-2"></i>FAQs</button>
        </div>
        <div class="card-admin-body">
          <div id="chatbotInner">Cargando...</div>
        </div>
      </div>
    `;
    const inner = document.getElementById('chatbotInner');
    const tabIntenciones = document.getElementById('tabIntenciones');
    const tabFaqs = document.getElementById('tabFaqs');

    const loadIntenciones = async () => {
      tabIntenciones.classList.add('active'); tabFaqs.classList.remove('active');
      try {
        const intents = await apiFetch('/admin/chatbot/intenciones');
        inner.innerHTML = `
          <table class="table-admin">
            <thead><tr><th>ID</th><th>Intención</th><th>Prioridad</th><th>Estado</th></tr></thead>
            <tbody>
              ${intents.map(i => `
                <tr>
                  <td>#${i.id}</td>
                  <td><strong>${i.nombre}</strong><br><small class="text-muted">${i.descripcion || ''}</small></td>
                  <td><span class="badge bg-primary">${i.prioridad}</span></td>
                  <td><span class="status-pill ${i.activa ? 'active' : 'inactive'}">${i.activa ? 'Activa' : 'Inactiva'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } catch (e) { inner.innerHTML = e.message; }
    };

    tabIntenciones.addEventListener('click', loadIntenciones);
    tabFaqs.addEventListener('click', async () => {
      tabFaqs.classList.add('active'); tabIntenciones.classList.remove('active');
      inner.innerHTML = 'Cargando FAQs...';
      try {
        const faqs = await apiFetch('/admin/chatbot/faqs');
        inner.innerHTML = `
          <table class="table-admin">
            <thead><tr><th>ID</th><th>Pregunta</th><th>Respuesta</th></tr></thead>
            <tbody>
              ${faqs.map(f => `<tr><td>#${f.id}</td><td><strong>${f.pregunta}</strong></td><td>${f.respuesta}</td></tr>`).join('')}
            </tbody>
          </table>
        `;
      } catch (e) { inner.innerHTML = e.message; }
    });

    loadIntenciones();
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
    navigate('dashboard');
  });
}