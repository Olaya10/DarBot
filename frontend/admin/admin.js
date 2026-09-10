const API_BASE = '/api';

function getToken() { return localStorage.getItem('darbot_admin_token'); }
function setToken(t){ if(t) localStorage.setItem('darbot_admin_token', t); else localStorage.removeItem('darbot_admin_token'); }

async function apiFetch(endpoint, options = {}){
  const headers = { 'Accept':'application/json', ...(options.body?{'Content-Type':'application/json'}:{}), ...(options.headers||{}) };
  const token = getToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + endpoint, { headers, ...options });
  if (res.status === 204) return null;
  if(res.status === 401 || res.status === 403){
    setToken(null);
    // redirect to login when in admin area
    if(location.pathname.startsWith('/admin')) location.href = '/admin/login.html';
    const text = await res.text().catch(()=>null);
    throw new Error(text || 'No autorizado');
  }
  if(!res.ok){ const text = await res.text().catch(()=>null); throw new Error(text || res.statusText); }
  return res.json();
}

function showModal(contentHtml){
  const overlay = document.createElement('div'); overlay.className = 'admin-modal';
  overlay.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${contentHtml}</div>`;
  document.body.appendChild(overlay);
  // focus handling and keyboard
  const modalBox = overlay.querySelector('.modal-box');
  const firstFocusable = modalBox.querySelector('input,textarea,select,button,a,[tabindex]');
  // set accessible name from first heading if present
  const h = modalBox.querySelector('h3'); if(h) modalBox.setAttribute('aria-label', h.textContent.trim());
  if(firstFocusable) firstFocusable.focus();

  function keyHandler(e){
    if(e.key === 'Escape') { closeModal(overlay); }
    if(e.key === 'Tab'){
      const focusables = modalBox.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if(focusables.length===0) return;
      const first = focusables[0]; const last = focusables[focusables.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }
  overlay._keyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(overlay); });
  return overlay;
}

// enhanced closeModal to clean keyboard handler if present
function closeModal(overlay){ if(!overlay) return; if(overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler); overlay.remove(); }

// --- Login page behavior ---
if (location.pathname.endsWith('/admin/login.html')) {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    try{
      const data = await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      setToken(data.token);
      location.href = '/admin/';
    }catch(err){
      errorEl.classList.remove('d-none');
      errorEl.textContent = err.message || 'No se pudo iniciar sesión';
    }
  });
}

// --- Admin SPA ---
if (location.pathname === '/admin/' || location.pathname === '/admin/index.html') {
  const routes = document.querySelectorAll('[data-route]');
  const viewContainer = document.getElementById('viewContainer');
  const pageTitle = document.getElementById('pageTitle');
  const logoutBtn = document.getElementById('logoutBtn');

  let currentUser = null;
  async function loadCurrentUser(){
    try{ currentUser = await apiFetch('/auth/me'); }catch(err){ currentUser = null; setToken(null); location.href = '/admin/login.html'; }
  }

  logoutBtn.addEventListener('click', ()=>{ setToken(null); location.href = '/admin/login.html'; });

  // mobile sidebar toggle: add button to header
  (function addSidebarToggle(){
    const header = document.querySelector('header'); if(!header) return;
    const btn = document.createElement('button'); btn.className = 'sidebar-toggle'; btn.setAttribute('aria-label','Toggle menu'); btn.setAttribute('aria-expanded','false'); btn.innerHTML = '☰';
    btn.addEventListener('click', ()=>{ const sb = document.querySelector('.admin-sidebar'); if(!sb) return; const open = sb.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); });
    header.insertBefore(btn, header.firstChild);
  })();

  async function renderDashboard(){
    pageTitle.textContent = 'Dashboard';
    viewContainer.innerHTML = `<div class="card p-3"><h3 class="h6">Bienvenido</h3><p>Panel administrativo de DarBot. Usa el menú para administrar usuarios, contenidos y el chatbot.</p></div>`;
  }

  async function renderUsuarios(){
    pageTitle.textContent = 'Usuarios';
    viewContainer.innerHTML = `<div class="card p-3"><div id="usuariosToolbar" class="mb-3"><button id="crearUsuario" class="btn btn-danger">Nuevo usuario</button></div><div id="usuariosList">Cargando...</div></div>`;
    const listEl = document.getElementById('usuariosList');
    try{
      const usuarios = await apiFetch('/admin/usuarios');
      listEl.innerHTML = `<table class="table"><thead><tr><th>Id</th><th>Nombre</th><th>Correo</th><th>Roles</th><th>Acciones</th></tr></thead><tbody>${usuarios.map(u=>`<tr><td>${u.id}</td><td>${u.nombre} ${u.apellido}</td><td>${u.correo}</td><td>${u.roles.join(', ')}</td><td><button data-id="${u.id}" class="btn btn-outline btn-edit">Editar</button> <button data-id="${u.id}" class="btn btn-outline btn-delete">Desactivar</button></td></tr>`).join('')}</tbody></table>`;
      document.getElementById('crearUsuario').addEventListener('click', async ()=>{
        const html = `
          <h3>Crear usuario</h3>
          <div class="form-row"><label>Username</label><input id="m_username" class="form-control"/></div>
          <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control"/></div>
          <div class="form-row"><label>Apellido</label><input id="m_apellido" class="form-control"/></div>
          <div class="form-row"><label>Correo</label><input id="m_correo" class="form-control"/></div>
          <div class="form-row"><label>Contraseña</label><input id="m_password" type="password" class="form-control"/></div>
          <div class="form-row"><label>Rol</label><select id="m_rol" class="form-control"><option>USER</option><option>ADMIN</option></select></div>
          <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
        const overlay = showModal(html);
        overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
        overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
          const username = overlay.querySelector('#m_username').value.trim(); if(!username){ alert('Username requerido'); return; }
          const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
          const apellido = overlay.querySelector('#m_apellido').value.trim(); if(!apellido){ alert('Apellido requerido'); return; }
          const correo = overlay.querySelector('#m_correo').value.trim(); if(!correo){ alert('Correo requerido'); return; }
          const password = overlay.querySelector('#m_password').value; if(!password){ alert('Contraseña requerida'); return; }
          const rol = overlay.querySelector('#m_rol').value || 'USER';
          try{ await apiFetch('/admin/usuarios/registrar', { method:'POST', body: JSON.stringify({ username, nombre, apellido, correo, password, rol }) }); closeModal(overlay); renderUsuarios(); }catch(err){ alert('Error: '+err.message); }
        });
      });

      document.querySelectorAll('.btn-delete').forEach(b=> b.addEventListener('click', async (e)=>{
        if(!confirm('Desactivar usuario?')) return; const id = b.dataset.id; await apiFetch(`/admin/usuarios/${id}`, { method:'DELETE' }); renderUsuarios();
      }));

      document.querySelectorAll('.btn-edit').forEach(b=> b.addEventListener('click', async ()=>{
        const id = b.dataset.id;
        try{
          const user = await apiFetch(`/admin/usuarios/${id}`);
          const html = `
            <h3>Editar usuario</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control" value="${user.nombre||''}"/></div>
            <div class="form-row"><label>Apellido</label><input id="m_apellido" class="form-control" value="${user.apellido||''}"/></div>
            <div class="form-row"><label>Correo</label><input id="m_correo" class="form-control" value="${user.correo||''}"/></div>
            <div class="form-row"><label>Contraseña (dejar vacío para mantener)</label><input id="m_password" type="password" class="form-control"/></div>
            <div class="form-row"><label>Roles (separar por comas)</label><input id="m_roles" class="form-control" value="${(user.roles||[]).join(', ')}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const apellido = overlay.querySelector('#m_apellido').value.trim(); if(!apellido){ alert('Apellido requerido'); return; }
            const correo = overlay.querySelector('#m_correo').value.trim(); if(!correo){ alert('Correo requerido'); return; }
            const password = overlay.querySelector('#m_password').value || null;
            try{ await apiFetch(`/admin/usuarios/${id}`, { method:'PUT', body: JSON.stringify({ nombre, apellido, correo, password }) });
              // roles from input
              const rolesRaw = overlay.querySelector('#m_roles').value || '';
              const roles = rolesRaw.split(',').map(s=>s.trim()).filter(Boolean);
              // sync roles: assign and remove simply by assigning each role (backend handles duplicates)
              for(const r of roles){ await apiFetch(`/admin/usuarios/${id}/roles?rol=${encodeURIComponent(r)}`, { method:'PATCH' }); }
              closeModal(overlay); renderUsuarios();
            }catch(err){ alert('Error: '+err.message); }
          });
        }catch(err){ alert('Error: '+err.message); }
      }));
    }catch(err){ listEl.innerHTML = `<div class="text-danger">${err.message}</div>`; }
  }

  async function renderChatbot(){
    pageTitle.textContent = 'Chatbot';
    viewContainer.innerHTML = `
      <div class="card p-3">
        <div class="mb-3">
          <button id="tabIntenciones" class="btn btn-outline">Intenciones</button>
          <button id="tabFaqs" class="btn btn-outline">FAQs</button>
          <button id="tabPreguntas" class="btn btn-outline">Preguntas pendientes</button>
        </div>
        <div id="chatbotContent">Cargando...</div>
      </div>
    `;

    const content = document.getElementById('chatbotContent');
    const loadIntenciones = async () => {
      content.innerHTML = 'Cargando intenciones...';
      try{
        const intents = await apiFetch('/admin/chatbot/intenciones');
        content.innerHTML = `<table class="table"><thead><tr><th>Id</th><th>Nombre</th><th>Prioridad</th><th>Activa</th><th>Acciones</th></tr></thead><tbody>${intents.map(i=>`<tr><td>${i.id}</td><td>${i.nombre}</td><td>${i.prioridad}</td><td>${i.activa}</td><td><button data-id="${i.id}" class="btn btn-outline btn-edit-int">Editar</button></td></tr>`).join('')}</tbody></table>`;
        document.querySelectorAll('.btn-edit-int').forEach(b=> b.addEventListener('click', async ()=>{
          const id = b.dataset.id; const row = intents.find(x=>x.id==id);
          const html = `
            <h3>Editar intención</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control" value="${row.nombre||''}"/></div>
            <div class="form-row"><label>Descripción</label><textarea id="m_descripcion" class="form-control">${row.descripcion||''}</textarea></div>
            <div class="form-row"><label>Prioridad</label><input id="m_prioridad" class="form-control" value="${row.prioridad||0}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const descripcion = overlay.querySelector('#m_descripcion').value||'';
            const prioridad = parseInt(overlay.querySelector('#m_prioridad').value||'0');
            try{ await apiFetch(`/admin/chatbot/intenciones/${id}`, { method:'PUT', body: JSON.stringify({ nombre, descripcion, prioridad, activa: row.activa }) }); closeModal(overlay); loadIntenciones(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadFaqs = async () => {
      content.innerHTML = 'Cargando FAQs...';
      try{
        const faqs = await apiFetch('/admin/chatbot/faqs');
        content.innerHTML = `<div class="mb-2"><button id="crearFaq" class="btn btn-danger">Crear FAQ</button></div><table class="table"><thead><tr><th>Id</th><th>Pregunta</th><th>Respuesta</th><th>Activa</th><th>Acciones</th></tr></thead><tbody>${faqs.map(f=>`<tr><td>${f.id}</td><td>${f.pregunta}</td><td>${f.respuesta}</td><td>${f.activa}</td><td><button data-id="${f.id}" class="btn btn-outline btn-edit-faq">Editar</button> <button data-id="${f.id}" class="btn btn-outline btn-delete-faq">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearFaq').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear FAQ</h3>
            <div class="form-row"><label>Pregunta</label><input id="m_pregunta" class="form-control"/></div>
            <div class="form-row"><label>Respuesta</label><textarea id="m_respuesta" class="form-control"></textarea></div>
            <div class="form-row"><label>Categoría</label><input id="m_categoria" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const pregunta = overlay.querySelector('#m_pregunta').value.trim(); if(!pregunta){ alert('Pregunta requerida'); return; }
            const respuesta = overlay.querySelector('#m_respuesta').value||'';
            const categoria = overlay.querySelector('#m_categoria').value||'';
            try{ await apiFetch('/admin/chatbot/faqs', { method:'POST', body: JSON.stringify({ pregunta, respuesta, categoria, activa: true }) }); closeModal(overlay); loadFaqs(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-faq').forEach(b=> b.addEventListener('click', async ()=>{
          const id = b.dataset.id; const f = faqs.find(x=>x.id==id);
          const html = `
            <h3>Editar FAQ</h3>
            <div class="form-row"><label>Pregunta</label><input id="m_pregunta" class="form-control" value="${f.pregunta||''}"/></div>
            <div class="form-row"><label>Respuesta</label><textarea id="m_respuesta" class="form-control">${f.respuesta||''}</textarea></div>
            <div class="form-row"><label>Categoría</label><input id="m_categoria" class="form-control" value="${f.categoria||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const pregunta = overlay.querySelector('#m_pregunta').value.trim(); if(!pregunta){ alert('Pregunta requerida'); return; }
            const respuesta = overlay.querySelector('#m_respuesta').value||'';
            const categoria = overlay.querySelector('#m_categoria').value||'';
            try{ await apiFetch(`/admin/chatbot/faqs/${id}`, { method:'PUT', body: JSON.stringify({ pregunta, respuesta, categoria, activa: f.activa }) }); closeModal(overlay); loadFaqs(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-faq').forEach(b=> b.addEventListener('click', async ()=>{
          if(!confirm('Eliminar FAQ?')) return; const id = b.dataset.id; await apiFetch(`/admin/chatbot/faqs/${id}`, { method:'DELETE' }); loadFaqs();
        }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadPreguntas = async () => {
      content.innerHTML = 'Cargando preguntas...';
      try{
        const preguntas = await apiFetch('/admin/chatbot/preguntas');
        content.innerHTML = `<table class="table"><thead><tr><th>Id</th><th>Pregunta</th><th>Fecha</th><th>Intento intencion</th><th>Resuelta</th><th>Acciones</th></tr></thead><tbody>${preguntas.map(p=>`<tr><td>${p.id}</td><td>${p.pregunta}</td><td>${new Date(p.fecha).toLocaleString()}</td><td>${p.intentoIntencion || ''}</td><td>${p.resuelta}</td><td><button data-id="${p.id}" class="btn btn-outline btn-resolver">Marcar resuelta</button> <button data-id="${p.id}" class="btn btn-outline btn-convertir">Convertir a FAQ</button> <button data-id="${p.id}" class="btn btn-outline btn-delete-preg">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.querySelectorAll('.btn-resolver').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; await apiFetch(`/admin/chatbot/preguntas/${id}/resolver`, { method:'PUT' }); loadPreguntas(); }));
        document.querySelectorAll('.btn-convertir').forEach(b=> b.addEventListener('click', async ()=>{
          const id=b.dataset.id;
          const html = `
            <h3>Convertir a FAQ</h3>
            <div class="form-row"><label>Respuesta</label><textarea id="m_respuesta" class="form-control"></textarea></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Convertir</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const respuesta = overlay.querySelector('#m_respuesta').value||''; try{ await apiFetch(`/admin/chatbot/preguntas/${id}/convertir-faq?respuesta=${encodeURIComponent(respuesta)}`, { method:'POST' }); closeModal(overlay); loadPreguntas(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-preg').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar pregunta?')) return; const id=b.dataset.id; await apiFetch(`/admin/chatbot/preguntas/${id}`, { method:'DELETE' }); loadPreguntas(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    document.getElementById('tabIntenciones').addEventListener('click', loadIntenciones);
    document.getElementById('tabFaqs').addEventListener('click', loadFaqs);
    document.getElementById('tabPreguntas').addEventListener('click', loadPreguntas);

    // inicial
    loadIntenciones();
  }

  async function renderContenidos(){
    pageTitle.textContent = 'Contenidos';
    viewContainer.innerHTML = `
      <div class="card p-3">
        <div class="mb-3">
          <button id="tabNoticias" class="btn btn-outline">Noticias</button>
          <button id="tabEventos" class="btn btn-outline">Eventos</button>
          <button id="tabDocumentos" class="btn btn-outline">Documentos</button>
        </div>
        <div id="contenidosContent">Cargando...</div>
      </div>
    `;

    const content = document.getElementById('contenidosContent');

    const loadNoticias = async ()=>{
      content.innerHTML = 'Cargando noticias...';
      try{
        const noticias = await apiFetch('/admin/contenidos/noticias');
        content.innerHTML = `<div class="mb-2"><button id="crearNoticia" class="btn btn-danger">Crear noticia</button></div><table class="table"><thead><tr><th>Id</th><th>Título</th><th>Resumen</th><th>Acciones</th></tr></thead><tbody>${noticias.map(n=>`<tr><td>${n.id}</td><td>${n.titulo}</td><td>${n.resumen||''}</td><td><button data-id="${n.id}" class="btn btn-outline btn-edit-not">Editar</button> <button data-id="${n.id}" class="btn btn-outline btn-delete-not">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearNoticia').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear noticia</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control"/></div>
            <div class="form-row"><label>Contenido</label><textarea id="m_contenido" class="form-control"></textarea></div>
            <div class="form-row"><label>Resumen (opcional)</label><input id="m_resumen" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const contenidoVal = overlay.querySelector('#m_contenido').value || '';
            const resumen = overlay.querySelector('#m_resumen').value || '';
            try{ await apiFetch('/admin/contenidos/noticias', { method:'POST', body: JSON.stringify({ titulo, contenido: contenidoVal, resumen, estado: 'publicado' }) }); closeModal(overlay); loadNoticias(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-not').forEach(b=> b.addEventListener('click', async ()=>{
          const id=b.dataset.id; const n = noticias.find(x=>x.id==id);
          const html = `
            <h3>Editar noticia</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control" value="${n.titulo||''}"/></div>
            <div class="form-row"><label>Contenido</label><textarea id="m_contenido" class="form-control">${n.contenido||''}</textarea></div>
            <div class="form-row"><label>Resumen</label><input id="m_resumen" class="form-control" value="${n.resumen||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const contenidoVal = overlay.querySelector('#m_contenido').value || '';
            const resumen = overlay.querySelector('#m_resumen').value || '';
            try{ await apiFetch(`/admin/contenidos/noticias/${id}`, { method:'PUT', body: JSON.stringify({ titulo, contenido: contenidoVal, resumen, estado: n.estado }) }); closeModal(overlay); loadNoticias(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-not').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar noticia?')) return; const id=b.dataset.id; await apiFetch(`/admin/contenidos/noticias/${id}`, { method:'DELETE' }); loadNoticias(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadEventos = async ()=>{
      content.innerHTML = 'Cargando eventos...';
      try{
        const eventos = await apiFetch('/admin/contenidos/eventos');
        content.innerHTML = `<div class="mb-2"><button id="crearEvento" class="btn btn-danger">Crear evento</button></div><table class="table"><thead><tr><th>Id</th><th>Título</th><th>Fecha</th><th>Lugar</th><th>Acciones</th></tr></thead><tbody>${eventos.map(ev=>`<tr><td>${ev.id}</td><td>${ev.titulo}</td><td>${ev.fecha}</td><td>${ev.lugar||''}</td><td><button data-id="${ev.id}" class="btn btn-outline btn-edit-ev">Editar</button> <button data-id="${ev.id}" class="btn btn-outline btn-delete-ev">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearEvento').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear evento</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control"/></div>
            <div class="form-row"><label>Fecha (YYYY-MM-DD)</label><input id="m_fecha" class="form-control"/></div>
            <div class="form-row"><label>Lugar</label><input id="m_lugar" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const fecha = overlay.querySelector('#m_fecha').value.trim(); if(!fecha){ alert('Fecha requerida'); return; }
            const lugar = overlay.querySelector('#m_lugar').value || '';
            try{ await apiFetch('/admin/contenidos/eventos', { method:'POST', body: JSON.stringify({ titulo, fecha, lugar, estado: 'publicado' }) }); closeModal(overlay); loadEventos(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-ev').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const ev = eventos.find(x=>x.id==id);
          const html = `
            <h3>Editar evento</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control" value="${ev.titulo||''}"/></div>
            <div class="form-row"><label>Fecha (YYYY-MM-DD)</label><input id="m_fecha" class="form-control" value="${ev.fecha||''}"/></div>
            <div class="form-row"><label>Lugar</label><input id="m_lugar" class="form-control" value="${ev.lugar||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const fecha = overlay.querySelector('#m_fecha').value.trim(); if(!fecha){ alert('Fecha requerida'); return; }
            const lugar = overlay.querySelector('#m_lugar').value || '';
            try{ await apiFetch(`/admin/contenidos/eventos/${id}`, { method:'PUT', body: JSON.stringify({ titulo, fecha, lugar, descripcion: ev.descripcion||'', horaInicio: ev.horaInicio||null, horaFin: ev.horaFin||null, estado: ev.estado }) }); closeModal(overlay); loadEventos(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-ev').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar evento?')) return; const id=b.dataset.id; await apiFetch(`/admin/contenidos/eventos/${id}`, { method:'DELETE' }); loadEventos(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadDocumentos = async ()=>{
      content.innerHTML = 'Cargando documentos...';
      try{
        const docs = await apiFetch('/admin/contenidos/documentos');
        content.innerHTML = `<div class="mb-2"><button id="crearDoc" class="btn btn-danger">Crear documento</button></div><table class="table"><thead><tr><th>Id</th><th>Título</th><th>Archivo</th><th>Acciones</th></tr></thead><tbody>${docs.map(d=>`<tr><td>${d.id}</td><td>${d.titulo}</td><td>${d.nombreArchivo}</td><td><button data-id="${d.id}" class="btn btn-outline btn-edit-doc">Editar</button> <button data-id="${d.id}" class="btn btn-outline btn-delete-doc">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearDoc').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear documento</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control"/></div>
            <div class="form-row"><label>Nombre archivo</label><input id="m_nombreArchivo" class="form-control"/></div>
            <div class="form-row"><label>Ruta archivo</label><input id="m_rutaArchivo" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const nombreArchivo = overlay.querySelector('#m_nombreArchivo').value.trim(); if(!nombreArchivo){ alert('Nombre archivo requerido'); return; }
            const rutaArchivo = overlay.querySelector('#m_rutaArchivo').value.trim(); if(!rutaArchivo){ alert('Ruta archivo requerida'); return; }
            try{ await apiFetch('/admin/contenidos/documentos', { method:'POST', body: JSON.stringify({ titulo, nombreArchivo, rutaArchivo, tipo: '', estado: 'publicado' }) }); closeModal(overlay); loadDocumentos(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-doc').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const d = docs.find(x=>x.id==id);
          const html = `
            <h3>Editar documento</h3>
            <div class="form-row"><label>Título</label><input id="m_titulo" class="form-control" value="${d.titulo||''}"/></div>
            <div class="form-row"><label>Nombre archivo</label><input id="m_nombreArchivo" class="form-control" value="${d.nombreArchivo||''}"/></div>
            <div class="form-row"><label>Ruta archivo</label><input id="m_rutaArchivo" class="form-control" value="${d.rutaArchivo||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const titulo = overlay.querySelector('#m_titulo').value.trim(); if(!titulo){ alert('Título requerido'); return; }
            const nombreArchivo = overlay.querySelector('#m_nombreArchivo').value.trim(); if(!nombreArchivo){ alert('Nombre archivo requerido'); return; }
            const rutaArchivo = overlay.querySelector('#m_rutaArchivo').value.trim(); if(!rutaArchivo){ alert('Ruta archivo requerida'); return; }
            try{ await apiFetch(`/admin/contenidos/documentos/${id}`, { method:'PUT', body: JSON.stringify({ titulo, nombreArchivo, rutaArchivo, tipo: d.tipo||'', estado: d.estado }) }); closeModal(overlay); loadDocumentos(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-doc').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar documento?')) return; const id=b.dataset.id; await apiFetch(`/admin/contenidos/documentos/${id}`, { method:'DELETE' }); loadDocumentos(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    document.getElementById('tabNoticias').addEventListener('click', loadNoticias);
    document.getElementById('tabEventos').addEventListener('click', loadEventos);
    document.getElementById('tabDocumentos').addEventListener('click', loadDocumentos);

    // inicial
    loadNoticias();
  }

  async function renderInstitucional(){
    pageTitle.textContent = 'Institucional';
    viewContainer.innerHTML = `
      <div class="card p-3">
        <div class="mb-3">
          <button id="tabInfo" class="btn btn-outline">Información</button>
          <button id="tabSedes" class="btn btn-outline">Sedes</button>
          <button id="tabAreas" class="btn btn-outline">Áreas</button>
          <button id="tabContactos" class="btn btn-outline">Contactos</button>
        </div>
        <div id="institucionalContent">Cargando...</div>
      </div>
    `;

    const content = document.getElementById('institucionalContent');

    const loadInfo = async ()=>{
      content.innerHTML = 'Cargando información...';
      try{
        const info = await apiFetch('/admin/institucional/info');
        if(!info){ content.innerHTML = `<div>No hay información registrada. <button id="crearInfo" class="btn btn-danger">Crear</button></div>`; document.getElementById('crearInfo').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear información institucional</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control"/></div>
            <div class="form-row"><label>Misión</label><textarea id="m_mision" class="form-control"></textarea></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const mision = overlay.querySelector('#m_mision').value||'';
            try{ await apiFetch('/admin/institucional/info', { method: 'POST', body: JSON.stringify({ nombre, mision, descripcion: '', filosofia: '', historia: '', logoUrl: '', vision: '', valores: '' }) }); closeModal(overlay); loadInfo(); }catch(err){ alert('Error: '+err.message); }
          });
        }); return; }
        content.innerHTML = `<div><h3>${info.nombre}</h3><p>${info.descripcion||''}</p><div class="mt-2"><button id="editarInfo" class="btn btn-outline">Editar</button></div></div>`;
        document.getElementById('editarInfo').addEventListener('click', async ()=>{
          const html = `
            <h3>Editar información institucional</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control" value="${info.nombre||''}"/></div>
            <div class="form-row"><label>Descripción</label><textarea id="m_descripcion" class="form-control">${info.descripcion||''}</textarea></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const descripcion = overlay.querySelector('#m_descripcion').value||'';
            try{ await apiFetch('/admin/institucional/info/guardar-o-actualizar', { method:'POST', body: JSON.stringify({ nombre, descripcion }) }); closeModal(overlay); loadInfo(); }catch(err){ alert('Error: '+err.message); }
          });
        });
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadSedes = async ()=>{
      content.innerHTML = 'Cargando sedes...';
      try{
        const sedes = await apiFetch('/admin/institucional/sedes');
        content.innerHTML = `<div class="mb-2"><button id="crearSede" class="btn btn-danger">Crear sede</button></div><table class="table"><thead><tr><th>Id</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>${sedes.map(s=>`<tr><td>${s.id}</td><td>${s.nombre}</td><td>${s.direccion||''}</td><td>${s.telefono||''}</td><td><button data-id="${s.id}" class="btn btn-outline btn-edit-sede">Editar</button> <button data-id="${s.id}" class="btn btn-outline btn-delete-sede">Eliminar</button> <button data-id="${s.id}" class="btn btn-outline btn-toggle-sede">${s.activa? 'Desactivar':'Activar'}</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearSede').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear sede</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control"/></div>
            <div class="form-row"><label>Dirección</label><input id="m_direccion" class="form-control"/></div>
            <div class="form-row"><label>Teléfono</label><input id="m_telefono" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const direccion = overlay.querySelector('#m_direccion').value || '';
            const telefono = overlay.querySelector('#m_telefono').value || '';
            try{ await apiFetch('/admin/institucional/sedes', { method:'POST', body: JSON.stringify({ nombre, direccion, telefono, activa: true }) }); closeModal(overlay); loadSedes(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-sede').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const s = sedes.find(x=>x.id==id);
          const html = `
            <h3>Editar sede</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control" value="${s.nombre||''}"/></div>
            <div class="form-row"><label>Dirección</label><input id="m_direccion" class="form-control" value="${s.direccion||''}"/></div>
            <div class="form-row"><label>Teléfono</label><input id="m_telefono" class="form-control" value="${s.telefono||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            const direccion = overlay.querySelector('#m_direccion').value || '';
            const telefono = overlay.querySelector('#m_telefono').value || '';
            try{ await apiFetch(`/admin/institucional/sedes/${id}`, { method:'PUT', body: JSON.stringify({ nombre, direccion, telefono, activa: s.activa }) }); closeModal(overlay); loadSedes(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-sede').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar sede?')) return; const id=b.dataset.id; await apiFetch(`/admin/institucional/sedes/${id}`, { method:'DELETE' }); loadSedes(); }));
        document.querySelectorAll('.btn-toggle-sede').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const s = sedes.find(x=>x.id==id); await apiFetch(`/admin/institucional/sedes/${id}/estado?activa=${!s.activa}`, { method:'PATCH' }); loadSedes(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadAreas = async ()=>{
      content.innerHTML = 'Cargando áreas...';
      try{
        const areas = await apiFetch('/admin/institucional/areas');
        content.innerHTML = `<div class="mb-2"><button id="crearArea" class="btn btn-danger">Crear área</button></div><table class="table"><thead><tr><th>Id</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody>${areas.map(a=>`<tr><td>${a.id}</td><td>${a.nombre}</td><td><button data-id="${a.id}" class="btn btn-outline btn-edit-area">Editar</button> <button data-id="${a.id}" class="btn btn-outline btn-delete-area">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearArea').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear área</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            try{ await apiFetch('/admin/institucional/areas', { method:'POST', body: JSON.stringify({ nombre }) }); closeModal(overlay); loadAreas(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-area').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const a = areas.find(x=>x.id==id);
          const html = `
            <h3>Editar área</h3>
            <div class="form-row"><label>Nombre</label><input id="m_nombre" class="form-control" value="${a.nombre||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const nombre = overlay.querySelector('#m_nombre').value.trim(); if(!nombre){ alert('Nombre requerido'); return; }
            try{ await apiFetch(`/admin/institucional/areas/${id}`, { method:'PUT', body: JSON.stringify({ nombre }) }); closeModal(overlay); loadAreas(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-area').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar área?')) return; const id=b.dataset.id; await apiFetch(`/admin/institucional/areas/${id}`, { method:'DELETE' }); loadAreas(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    const loadContactos = async ()=>{
      content.innerHTML = 'Cargando contactos...';
      try{
        const contactos = await apiFetch('/admin/institucional/contactos');
        content.innerHTML = `<div class="mb-2"><button id="crearContacto" class="btn btn-danger">Crear contacto</button></div><table class="table"><thead><tr><th>Id</th><th>Tipo</th><th>Valor</th><th>Área</th><th>Acciones</th></tr></thead><tbody>${contactos.map(c=>`<tr><td>${c.id}</td><td>${c.tipo}</td><td>${c.valor}</td><td>${c.areaNombre||''}</td><td><button data-id="${c.id}" class="btn btn-outline btn-edit-contacto">Editar</button> <button data-id="${c.id}" class="btn btn-outline btn-delete-contacto">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
        document.getElementById('crearContacto').addEventListener('click', async ()=>{
          const html = `
            <h3>Crear contacto</h3>
            <div class="form-row"><label>Tipo</label><select id="m_tipo" class="form-control"><option value="telefono">telefono</option><option value="email">email</option><option value="otro">otro</option></select></div>
            <div class="form-row"><label>Valor</label><input id="m_valor" class="form-control"/></div>
            <div class="form-row"><label>Area id (opcional)</label><input id="m_areaId" class="form-control"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Crear</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const tipo = overlay.querySelector('#m_tipo').value; if(!tipo){ alert('Tipo requerido'); return; }
            const valor = overlay.querySelector('#m_valor').value.trim(); if(!valor){ alert('Valor requerido'); return; }
            const areaIdRaw = overlay.querySelector('#m_areaId').value.trim(); const areaId = areaIdRaw ? Number(areaIdRaw) : null;
            try{ await apiFetch('/admin/institucional/contactos', { method:'POST', body: JSON.stringify({ tipo, valor, descripcion:'', areaId: areaId, activo: true }) }); closeModal(overlay); loadContactos(); }catch(err){ alert('Error: '+err.message); }
          });
        });
        document.querySelectorAll('.btn-edit-contacto').forEach(b=> b.addEventListener('click', async ()=>{ const id=b.dataset.id; const c = contactos.find(x=>x.id==id);
          const html = `
            <h3>Editar contacto</h3>
            <div class="form-row"><label>Tipo</label><select id="m_tipo" class="form-control"><option value="telefono" ${c.tipo==='telefono'?'selected':''}>telefono</option><option value="email" ${c.tipo==='email'?'selected':''}>email</option><option value="otro" ${c.tipo==='otro'?'selected':''}>otro</option></select></div>
            <div class="form-row"><label>Valor</label><input id="m_valor" class="form-control" value="${c.valor||''}"/></div>
            <div class="form-row"><label>Area id (opcional)</label><input id="m_areaId" class="form-control" value="${c.areaId||''}"/></div>
            <div class="modal-actions"><button id="m_cancel" class="btn btn-outline">Cancelar</button><button id="m_submit" class="btn btn-danger">Guardar</button></div>`;
          const overlay = showModal(html);
          overlay.querySelector('#m_cancel').addEventListener('click', ()=> closeModal(overlay));
          overlay.querySelector('#m_submit').addEventListener('click', async ()=>{
            const tipo = overlay.querySelector('#m_tipo').value; if(!tipo){ alert('Tipo requerido'); return; }
            const valor = overlay.querySelector('#m_valor').value.trim(); if(!valor){ alert('Valor requerido'); return; }
            const areaIdRaw = overlay.querySelector('#m_areaId').value.trim(); const areaId = areaIdRaw ? Number(areaIdRaw) : null;
            try{ await apiFetch(`/admin/institucional/contactos/${id}`, { method:'PUT', body: JSON.stringify({ tipo, valor, descripcion: c.descripcion||'', areaId: areaId, activo: c.activo }) }); closeModal(overlay); loadContactos(); }catch(err){ alert('Error: '+err.message); }
          });
        }));
        document.querySelectorAll('.btn-delete-contacto').forEach(b=> b.addEventListener('click', async ()=>{ if(!confirm('Eliminar contacto?')) return; const id=b.dataset.id; await apiFetch(`/admin/institucional/contactos/${id}`, { method:'DELETE' }); loadContactos(); }));
      }catch(err){ content.innerHTML = `<div class="text-danger">${err.message}</div>`; }
    };

    document.getElementById('tabInfo').addEventListener('click', loadInfo);
    document.getElementById('tabSedes').addEventListener('click', loadSedes);
    document.getElementById('tabAreas').addEventListener('click', loadAreas);
    document.getElementById('tabContactos').addEventListener('click', loadContactos);

    // inicial
    loadInfo();
  }

  function setActiveRoute(route){ routes.forEach(r=> r.classList.toggle('active', r.dataset.route===route)); }

  routes.forEach(r=> r.addEventListener('click', (e)=>{ e.preventDefault(); const route = r.dataset.route; setActiveRoute(route); if(route==='dashboard') renderDashboard(); if(route==='usuarios') renderUsuarios(); if(route==='chatbot') renderChatbot(); if(route==='contenidos') renderContenidos(); if(route==='institucional') renderInstitucional();
    // close mobile sidebar after navigation
    try{ const sb = document.querySelector('.admin-sidebar'); const btn = document.querySelector('.sidebar-toggle'); if(sb && sb.classList.contains('open') && window.innerWidth <= 900){ sb.classList.remove('open'); if(btn) btn.setAttribute('aria-expanded','false'); } }catch(_){ }
  }));

  // Initial render
  (async ()=>{
    if(!getToken()){ location.href = '/admin/login.html'; return; }
    await loadCurrentUser();
    await renderDashboard();
  })();
}

export {};
