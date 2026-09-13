// ============================================
// CONFIGURACIÓN DE API
// ============================================
const API_BASE_HOST = (typeof window !== 'undefined' && window.location && window.location.port && window.location.port !== '8080')
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : '';
const API_BASE = `${API_BASE_HOST}/api/public`;
const API_BASE_CONTENIDOS = `${API_BASE_HOST}/api/contenidos`;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// ============================================
// FETCH GENÉRICO
// ============================================
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'La petición falló');
  }

  return response.json();
}

// Fetch específico para /api/contenidos (noticias, eventos, documentos)
async function apiFetchContenidos(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_CONTENIDOS}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en ${endpoint}`);
  }

  return response.json();
}

// ============================================
// UTILIDADES
// ============================================
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatearFecha(fecha) {
  if (!fecha) return '';
  try {
    const d = new Date(fecha);
    return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '';
  }
}

// ============================================
// INICIALIZADORES DE UI
// ============================================
function inicializarNavbarScroll() {
  const navbar = document.getElementById('navbarPrincipal');
  const heroSection = document.querySelector('.hero');
  if (!navbar) return;

  const heroHeight = heroSection ? heroSection.offsetHeight : 300;
  window.addEventListener('scroll', () => {
    if (window.scrollY > (heroHeight - 80)) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });
}

function inicializarContadores() {
  const contadores = document.querySelectorAll('.contador');
  if (!contadores.length) return;

  let contadoresIniciados = false;
  const animarContadores = () => {
    contadores.forEach(contador => {
      const objetivo = +contador.getAttribute('data-objetivo');
      const incremento = objetivo / 100;

      const actualizarNumero = () => {
        const valorActual = +contador.textContent;
        if (valorActual < objetivo) {
          contador.textContent = Math.ceil(valorActual + incremento);
          setTimeout(actualizarNumero, 20);
        } else {
          contador.textContent = objetivo;
        }
      };
      actualizarNumero();
    });
  };

  const seccionStats = document.getElementById('estadisticas');
  if (seccionStats) {
    window.addEventListener('scroll', () => {
      const posicionStats = seccionStats.getBoundingClientRect().top;
      const alturaPantalla = window.innerHeight;

      if (posicionStats < alturaPantalla && !contadoresIniciados) {
        animarContadores();
        contadoresIniciados = true;
      }
    });
  }
}

function inicializarBotonVolverArriba() {
  const btnVolverArriba = document.getElementById('volver-arriba');
  if (!btnVolverArriba) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btnVolverArriba.style.display = 'block';
    } else {
      btnVolverArriba.style.display = 'none';
    }
  });

  btnVolverArriba.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function inicializarContactoForm() {
  const formulario = document.getElementById('formularioContacto');
  const mensajeExito = document.getElementById('mensajeEnvioExitoso');
  if (!formulario) return;

  formulario.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!formulario.checkValidity()) {
      event.stopPropagation();
      formulario.classList.add('was-validated');
      return;
    }

    formulario.classList.remove('was-validated');
    formulario.reset();

    if (mensajeExito) {
      mensajeExito.classList.remove('d-none');
      setTimeout(() => mensajeExito.classList.add('d-none'), 5000);
    }
  }, false);
}

function inicializarGaleriaLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCerrar = document.getElementById('lightboxCerrar');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  if (!lightbox || !lightboxImg) return;

  const getVisibleImages = () => {
    return Array.from(document.querySelectorAll('.galeria-col'))
      .filter(col => window.getComputedStyle(col).display !== 'none')
      .map(col => col.querySelector('.galeria-item img'))
      .filter(Boolean);
  };

  let visibleImages = [];
  let indiceActual = 0;

  const abrirLightbox = (imgEl) => {
    visibleImages = getVisibleImages();
    indiceActual = visibleImages.indexOf(imgEl);
    if (indiceActual === -1) indiceActual = 0;
    lightboxImg.src = imgEl.src;
    lightbox.style.display = 'flex';
  };

  document.querySelectorAll('.galeria-item img').forEach(img => {
    if (img._lightboxHandler) {
      img.removeEventListener('click', img._lightboxHandler);
    }
    img._lightboxHandler = () => abrirLightbox(img);
    img.addEventListener('click', img._lightboxHandler);
  });

  if (lightboxCerrar && !lightboxCerrar._hasListener) {
    lightboxCerrar._hasListener = true;
    lightboxCerrar.addEventListener('click', () => {
      lightbox.style.display = 'none';
    });
  }

  if (lightboxPrev && !lightboxPrev._hasListener) {
    lightboxPrev._hasListener = true;
    lightboxPrev.addEventListener('click', () => {
      visibleImages = getVisibleImages();
      if (!visibleImages.length) return;
      indiceActual = (indiceActual - 1 + visibleImages.length) % visibleImages.length;
      lightboxImg.src = visibleImages[indiceActual].src;
    });
  }

  if (lightboxNext && !lightboxNext._hasListener) {
    lightboxNext._hasListener = true;
    lightboxNext.addEventListener('click', () => {
      visibleImages = getVisibleImages();
      if (!visibleImages.length) return;
      indiceActual = (indiceActual + 1) % visibleImages.length;
      lightboxImg.src = visibleImages[indiceActual].src;
    });
  }
}

function inicializarFiltroGaleria() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.galeria-col');
  if (!filterBtns.length || !items.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
      items.forEach(item => {
        const rawCategory = item.getAttribute('data-category') || '';
        const category = rawCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function inicializarCargarMas() {
  const btnCargarMas = document.getElementById('btnCargarMas');
  if (!btnCargarMas) return;

  btnCargarMas.addEventListener('click', () => {
    const extraImgs = document.querySelectorAll('.extra-img');
    extraImgs.forEach(img => img.classList.remove('d-none'));
    btnCargarMas.style.display = 'none';
  });
}

// ============================================
// CHATBOT
// ============================================
function normalizarTextoChat(text = '') {
  return String(text)
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function getChatbotSessionId() {
  let sessionId = localStorage.getItem('darbot_chatbot_session');

  if (!sessionId) {
    sessionId = `darbot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('darbot_chatbot_session', sessionId);
  }

  return sessionId;
}

function inicializarChatbot() {
  if (document.getElementById('darbotChatWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'darbotChatWidget';
  widget.innerHTML = `
    <button id="darbotChatToggle" class="darbot-chat-toggle" type="button" aria-label="Abrir chat de ayuda">
      <i class="fa-solid fa-comment-dots"></i>
    </button>
    <div id="darbotChatPanel" class="darbot-chat-panel" aria-live="polite">
      <div class="darbot-chat-header">
        <div class="darbot-chat-title-wrap">
          <span class="darbot-chat-avatar"><i class="fa-solid fa-robot"></i></span>
          <div>
            <strong>DarBot</strong>
            <small>Asistente escolar</small>
          </div>
        </div>
        <button type="button" id="darbotChatClose" class="darbot-chat-close" aria-label="Cerrar chat">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div id="darbotChatMessages" class="darbot-chat-messages">
        <div class="darbot-message darbot-message-bot">
          <p>¡Hola! Soy DarBot. Puedo ayudarte con matrícula, oferta académica, horarios, contacto y más.</p>
        </div>
      </div>
      <div class="darbot-chat-suggestions">
        <button type="button" class="darbot-chat-suggestion">Oferta académica</button>
        <button type="button" class="darbot-chat-suggestion">Matrícula</button>
        <button type="button" class="darbot-chat-suggestion">Contacto</button>
      </div>
      <form id="darbotChatForm" class="darbot-chat-form">
        <input id="darbotChatInput" type="text" maxlength="2000" placeholder="Escribe tu pregunta..." aria-label="Escribe tu pregunta" required>
        <button type="submit" aria-label="Enviar mensaje">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(widget);

  const chatToggle = document.getElementById('darbotChatToggle');
  const chatPanel = document.getElementById('darbotChatPanel');
  const chatClose = document.getElementById('darbotChatClose');
  const chatForm = document.getElementById('darbotChatForm');
  const chatInput = document.getElementById('darbotChatInput');
  const chatMessages = document.getElementById('darbotChatMessages');
  const suggestionButtons = document.querySelectorAll('.darbot-chat-suggestion');

  const addMessage = (text, isUser = false) => {
    const messageEl = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.className = `darbot-message ${isUser ? 'darbot-message-user' : 'darbot-message-bot'}`;

    const p = document.createElement('p');
    const textoNormalizado = normalizarTextoChat(text);
    p.textContent = textoNormalizado || 'Sin respuesta.';
    wrapper.appendChild(p);
    messageEl.appendChild(wrapper);
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const openChat = () => {
    chatPanel.classList.add('open');
    chatToggle.classList.add('hidden');
    setTimeout(() => chatInput.focus(), 150);
  };

  const closeChat = () => {
    chatPanel.classList.remove('open');
    chatToggle.classList.remove('hidden');
  };

  chatToggle.addEventListener('click', openChat);
  chatClose.addEventListener('click', closeChat);

  suggestionButtons.forEach(button => {
    button.addEventListener('click', () => {
      chatInput.value = button.textContent.trim();
      openChat();
      chatInput.focus();
    });
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mensaje = chatInput.value.trim();

    if (!mensaje) return;

    addMessage(mensaje, true);
    chatInput.value = '';

    try {
      const response = await fetch(`${API_BASE_HOST}/api/chatbot/pregunta`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: getChatbotSessionId(),
          mensaje,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener respuesta del bot');
      }

      const data = await response.json();
      const respuesta = data?.respuesta || 'No tengo una respuesta clara para eso en este momento.';
      addMessage(respuesta, false);
    } catch (error) {
      addMessage('No pude responder en este momento. Intenta nuevamente más tarde.', false);
      console.error('Error chatbot:', error);
    }
  });
}

// ============================================
// CARGA DE DATOS DESDE API
// ============================================

// Configuración institucional (navbar, footer, contacto)
async function cargarConfiguracion() {
  try {
    const config = await apiFetch('/configuracion');
    const nombre = config.institucion_nombre || 'I.E. Darío Torregroza Pérez';
    const lema = config.institucion_lema || 'Camino a la excelencia';

    document.querySelectorAll('.institucion-nombre, .navbar-brand .fw-bold, .footer-brand-name').forEach(el => {
      el.textContent = nombre;
    });

    document.querySelectorAll('.institucion-lema, .navbar-brand small, .footer-brand-tag').forEach(el => {
      el.textContent = lema;
    });

    const selectors = {
      direccion: ['#contactDireccion', '#footerDireccion'],
      telefono: ['#contactTelefono', '#footerTelefono'],
      email: ['#contactEmail', '#footerEmail'],
    };

    Object.entries(selectors).forEach(([key, list]) => {
      const value = config[key] || '';
      list.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
      });
    });

    const mapElement = document.getElementById('contactMap');
    if (mapElement && config.mapa_embed) {
      mapElement.src = config.mapa_embed;
    }

    // ═══════════════════════════════════════════════════
    // REDES SOCIALES (con soporte para ocultar si están vacías)
    // ═══════════════════════════════════════════════════
    const redesConfig = {
      facebook: config.facebook,
      instagram: config.instagram,
      youtube: config.youtube,
      blogger: config.blogger || 'https://ieeldariotorregroza.blogspot.com/',  // Fallback
    };

    document.querySelectorAll('[data-social]').forEach(el => {
      const red = el.dataset.social;
      const url = (redesConfig[red] || '').trim();
      
      if (url) {
        // Hay URL → mostrar y actualizar
        el.href = url;
        el.style.display = '';
      } else {
        // Sin URL → ocultar el ícono
        el.style.display = 'none';
      }
    });

    // Actualizar logo institucional en todas sus variantes
    const logoUrl = config.logo_url || 'imagenes/Logo IEDTP.jpeg';

    // 1. Imágenes del navbar, footer, login (todas las que tengan la clase)
    document.querySelectorAll('img.institucion-logo').forEach(img => {
      img.src = logoUrl;
    });

    // 2. Favicon
    document.querySelectorAll('link.institucion-favicon, link[rel="icon"]').forEach(link => {
      link.href = logoUrl;
    });

    // Hero (título y frase)
    const heroTitulo = document.querySelector('.hero h1');
    if (heroTitulo && config.hero_titulo) {
      heroTitulo.textContent = config.hero_titulo;
    }
    const heroFrase = document.querySelector('.hero .frase');
    if (heroFrase && config.hero_frase) {
      heroFrase.textContent = config.hero_frase;
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración pública:', error);
  }
}

// Oferta académica
async function cargarOfertaAcademica() {
  const container = document.getElementById('ofertaAcademicaList');
  if (!container) return;

  try {
    const ofertas = await apiFetch('/oferta-academica');
    container.innerHTML = ofertas.map((oferta, index) => `
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="${index * 150}">
        <div class="tarjeta-oferta">
          <i class="${escapeHtml(oferta.icono || 'fa-solid fa-graduation-cap')} icono-oferta"></i>
          <h3>${escapeHtml(oferta.nombre || 'Oferta académica')}</h3>
          <p>${escapeHtml(oferta.descripcion || '')}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar la oferta académica:', error);
  }
}

// Galería
async function cargarGaleria() {
  const target = document.getElementById('galeria-grid');
  if (!target) return;

  try {
    const items = await apiFetch('/galeria');
    if (Array.isArray(items) && items.length > 0) {
      target.innerHTML = items.map((item, index) => `
        <div class="col-6 col-md-4 galeria-col ${index >= 6 ? 'extra-img d-none' : ''}" data-category="${escapeHtml(item.categoria || 'academico')}" data-aos="fade-up">
          <div class="galeria-item rounded-4 overflow-hidden shadow-sm" data-index="${index}">
            <img src="${escapeHtml(item.imagenUrl || 'imagenes/galeria1.jpg')}" alt="${escapeHtml(item.titulo || 'Galería institucional')}" loading="lazy">
            <div class="galeria-overlay d-flex align-items-center justify-content-center">
              <span class="fw-semibold text-white"><i class="fa-solid fa-magnifying-glass-plus me-2"></i>${escapeHtml(item.titulo || 'Galería')}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.warn('No se pudo cargar la galería desde la API, utilizando respaldo HTML local:', error);
  } finally {
    inicializarGaleriaLightbox();
    inicializarFiltroGaleria();
    inicializarCargarMas();
  }
}

// Requisitos de matrícula
async function cargarRequisitosMatricula() {
  const pasosContainer = document.getElementById('pasosMatriculaList');
  const preescolarList = document.getElementById('listaRequisitosPreescolar');
  const primariaList = document.getElementById('listaRequisitosPrimaria');

  if (!pasosContainer && !preescolarList && !primariaList) return;

  try {
    const requisitos = await apiFetch('/matricula');

    if (pasosContainer) {
      pasosContainer.innerHTML = requisitos.map((item, index) => `
        <div class="paso-matricula d-flex mb-3">
          <div class="paso-num me-3">${index + 1}</div>
          <div>
            <h4 class="h5 fw-bold mb-1">${escapeHtml(item.titulo || 'Requisito')}</h4>
            <p class="text-secondary mb-0">${escapeHtml(item.descripcion || '')}</p>
          </div>
        </div>
      `).join('');
    }

    if (preescolarList) {
      const grupoPreescolar = requisitos.find(item => (item.nivel || '').toLowerCase() === 'preescolar');
      preescolarList.innerHTML = (grupoPreescolar?.items || []).map(item => `
        <li class="d-flex align-items-center gap-3">
          <i class="fa-solid fa-circle-check text-danger fs-5"></i>
          <span>${escapeHtml(item.texto || '')}</span>
        </li>
      `).join('');
    }

    if (primariaList) {
      const grupoPrimaria = requisitos.find(item => (item.nivel || '').toLowerCase() === 'primaria') || requisitos.find(item => (item.nivel || '').toLowerCase() === 'secundaria');
      primariaList.innerHTML = (grupoPrimaria?.items || []).map(item => `
        <li class="d-flex align-items-center gap-3">
          <i class="fa-solid fa-circle-check text-danger fs-5"></i>
          <span>${escapeHtml(item.texto || '')}</span>
        </li>
      `).join('');
    }
  } catch (error) {
    console.warn('No se pudo cargar los requisitos de matrícula:', error);
  }
}

// ============================================
// NOTICIAS
// ============================================
async function cargarNoticias() {
  const target = document.getElementById('noticiasGrid');
  if (!target) return;

  try {
    const noticias = await apiFetchContenidos('/noticias');
    if (!Array.isArray(noticias) || noticias.length === 0) {
      target.innerHTML = '<p class="text-center text-secondary">Próximamente...</p>';
      return;
    }

    target.innerHTML = noticias.slice(0, 3).map((n, i) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${i * 150}">
        <article class="tarjeta-noticia">
          <div class="noticia-img">
            <img src="${escapeHtml(n.imagenUrl || 'imagenes/estudiantes2.jpg')}" 
                 alt="${escapeHtml(n.titulo)}" loading="lazy">
            <span class="noticia-fecha">${formatearFecha(n.fechaPublicacion)}</span>
          </div>
          <div class="noticia-cuerpo">
            <h3>${escapeHtml(n.titulo)}</h3>
            <p>${escapeHtml(n.resumen || '')}</p>
            <a href="noticias.html#noticia-${n.id}" class="enlace-leer-mas">
              Leer más <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </article>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar noticias:', error);
  }
}

// ============================================
// EVENTOS
// ============================================
async function cargarEventos() {
  const target = document.getElementById('eventosGrid');
  if (!target) return;

  try {
    const eventos = await apiFetchContenidos('/eventos');
    if (!Array.isArray(eventos) || eventos.length === 0) {
      target.innerHTML = '<p class="text-center text-secondary">Sin eventos próximos.</p>';
      return;
    }

    target.innerHTML = eventos.slice(0, 4).map((ev, i) => {
      const d = new Date(ev.fecha);
      return `
        <div class="evento-fila" data-aos="fade-up" data-aos-delay="${i * 100}">
          <div class="evento-fecha">
            <span class="dia">${d.getDate()}</span>
            <span class="mes">${MESES_CORTOS[d.getMonth()]}</span>
          </div>
          <div>
            <h4>${escapeHtml(ev.titulo)}</h4>
            <p>${escapeHtml(ev.descripcion || '')}</p>
            ${ev.lugar ? `<small class="text-secondary"><i class="fa-solid fa-location-dot me-1"></i>${escapeHtml(ev.lugar)}</small>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.warn('No se pudo cargar eventos:', error);
  }
}

// ============================================
// PREINSCRIPCIÓN
// ============================================
function inicializarPreinscripcion() {
  const form = document.getElementById('formPreinscripcion');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    form.classList.remove('was-validated');

    const formData = Object.fromEntries(new FormData(form).entries());
    const payload = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      fechaNacimiento: formData.fechaNacimiento || null,
      email: formData.email || null,
      telefono: formData.telefono || null,
      nivelInteres: formData.nivelInteres,
      sede: formData.sede || null,
      observaciones: formData.observaciones || null,
      estado: formData.estado || 'pendiente',
    };

    try {
      await apiFetch('/preinscripciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const statusEl = document.getElementById('preinscripcionStatus');
      if (statusEl) {
        statusEl.textContent = '¡Preinscripción registrada con éxito!';
        statusEl.className = 'alert alert-success mt-3';
        statusEl.classList.remove('d-none');
      }
      form.reset();

      if (window.bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalInscripcion'));
        if (modal) {
          setTimeout(() => modal.hide(), 1200);
        }
      }
    } catch (error) {
      const statusEl = document.getElementById('preinscripcionStatus');
      if (statusEl) {
        statusEl.textContent = 'No se pudo enviar la preinscripción. Verifica los datos e inténtalo nuevamente.';
        statusEl.className = 'alert alert-danger mt-3';
      }
      console.error(error);
    }
  });
}

// ============================================
// SEDES INSTITUCIONALES
// ============================================
async function cargarSedes() {
  const target = document.getElementById('sedesList');
  if (!target) return;

  try {
    const res = await fetch(`${API_BASE_HOST}/api/institucional/sedes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const sedes = await res.json();
    
    if (!Array.isArray(sedes) || sedes.length === 0) {
      target.innerHTML = '<p class="text-center text-muted">No hay sedes registradas.</p>';
      return;
    }

    target.innerHTML = sedes.map((s, i) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="card tarjeta-nosotros h-100 border-0 shadow-sm rounded-4 p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="icono-contenedor me-3" style="width:50px;height:50px;font-size:1.2rem;">
              <i class="fa-solid fa-building"></i>
            </div>
            <h3 class="h5 fw-bold text-dark mb-0">${escapeHtml(s.nombre)}</h3>
          </div>
          ${s.descripcion ? `<p class="text-secondary small mb-3">${escapeHtml(s.descripcion)}</p>` : ''}
          <ul class="list-unstyled mb-0 small">
            <li class="mb-2">
              <i class="fa-solid fa-location-dot text-danger me-2"></i>
              ${escapeHtml(s.direccion || '')}
            </li>
            ${s.telefono ? `
              <li class="mb-2">
                <i class="fa-solid fa-phone text-danger me-2"></i>
                ${escapeHtml(s.telefono)}
              </li>
            ` : ''}
            ${s.jornada ? `
              <li class="mb-2">
                <i class="fa-solid fa-clock text-danger me-2"></i>
                Jornada ${escapeHtml(s.jornada)}
              </li>
            ` : ''}
            ${s.horarioAtencion ? `
              <li class="mb-0">
                <i class="fa-regular fa-calendar text-danger me-2"></i>
                ${escapeHtml(s.horarioAtencion)}
              </li>
            ` : ''}
          </ul>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudieron cargar las sedes:', error);
    target.innerHTML = '<p class="text-center text-muted">Error al cargar sedes.</p>';
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// ============================================
// NOTICIAS - Página completa (noticias.html)
// ============================================
async function cargarNoticiasPagina() {
  const target = document.getElementById('noticiasList');
  if (!target) return;

  try {
    const noticias = await apiFetchContenidos('/noticias');
    if (!Array.isArray(noticias) || noticias.length === 0) {
      target.innerHTML = '<p class="text-center text-secondary">Próximamente publicaremos noticias.</p>';
      return;
    }

    target.innerHTML = noticias.map(n => `
      <article class="col-12" id="noticia-${n.id}">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="row g-0 align-items-center">
            <div class="col-lg-5">
              <img src="${escapeHtml(n.imagenUrl || 'imagenes/estudiantes2.jpg')}" 
                   class="img-fluid w-100 h-100 object-fit-cover" 
                   alt="${escapeHtml(n.titulo)}" 
                   style="min-height: 280px;">
            </div>
            <div class="col-lg-7">
              <div class="card-body p-4 p-md-5">
                <span class="badge bg-danger mb-2">${formatearFecha(n.fechaPublicacion)}</span>
                <h2 class="card-title fw-bold mb-3">${escapeHtml(n.titulo)}</h2>
                <p class="card-text text-secondary fs-5">${escapeHtml(n.resumen || '')}</p>
                <p class="card-text text-secondary">${escapeHtml(n.contenido || '')}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar las noticias:', error);
    target.innerHTML = '<p class="text-center text-secondary">Error al cargar noticias.</p>';
  }
}

// ============================================
// ESTADÍSTICAS
// ============================================
async function cargarEstadisticas() {
  const target = document.getElementById('estadisticasList');
  if (!target) return;

  try {
    const stats = await apiFetch('/estadisticas');
    if (!Array.isArray(stats) || stats.length === 0) return;

    target.innerHTML = stats.map((s, i) => `
      <div class="col-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="stat-item">
          <div class="stat-numero">
            <span class="contador" data-objetivo="${s.value}">0</span>${escapeHtml(s.sufijo || '')}
          </div>
          <div class="stat-label">${escapeHtml(s.label)}</div>
        </div>
      </div>
    `).join('');

    // Reiniciar contadores después de inyectar HTML
    inicializarContadores();
  } catch (error) {
    console.warn('No se pudo cargar estadísticas:', error);
  }
}



// ============================================
// INFORMACIÓN INSTITUCIONAL (Misión, Visión, Historia)
// ============================================
async function cargarInfoInstitucional() {
  try {
    const res = await fetch(`${API_BASE_HOST}/api/institucional/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();

    const misionEl = document.getElementById('infoMision');
    if (misionEl && info.mision) misionEl.textContent = info.mision;

    const visionEl = document.getElementById('infoVision');
    if (visionEl && info.vision) visionEl.textContent = info.vision;

    const historiaEl = document.getElementById('infoHistoria');
    if (historiaEl && info.historia) historiaEl.textContent = info.historia;
  } catch (error) {
    console.warn('No se pudo cargar info institucional:', error);
  }
}

// ============================================
// FAQs (Preguntas Frecuentes)
// ============================================
async function cargarFaqs() {
  const target = document.getElementById('acordeonFaq');
  if (!target) return;

  try {
    const faqs = await apiFetch('/faqs');
    if (!Array.isArray(faqs) || faqs.length === 0) return;

    target.innerHTML = faqs.map((f, i) => `
      <div class="accordion-item">
        <h3 class="accordion-header">
          <button class="accordion-button ${i === 0 ? '' : 'collapsed'}" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#faq-${f.id}"
                  aria-expanded="${i === 0 ? 'true' : 'false'}"
                  aria-controls="faq-${f.id}">
            ${escapeHtml(f.pregunta)}
          </button>
        </h3>
        <div id="faq-${f.id}" 
             class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" 
             data-bs-parent="#acordeonFaq">
          <div class="accordion-body">${escapeHtml(f.respuesta)}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar FAQs:', error);
  }
}

// ============================================
// EQUIPO DIRECTIVO
// ============================================
async function cargarEquipo() {
  const target = document.getElementById('equipoList');
  if (!target) return;

  try {
    const equipo = await apiFetch('/equipo');
    if (!Array.isArray(equipo) || equipo.length === 0) return;

    target.innerHTML = equipo.map((m, i) => `
      <div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="tarjeta-equipo">
          <div class="foto-wrap">
            <img src="${escapeHtml(m.fotoUrl || 'imagenes/Logo IEDTP.jpeg')}" 
                 alt="Fotografía de ${escapeHtml(m.nombre)}" 
                 loading="lazy">
          </div>
          <h3>${escapeHtml(m.nombre)}</h3>
          <p class="cargo">${escapeHtml(m.cargo)}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar equipo directivo:', error);
  }
}

// ============================================
// VALORES INSTITUCIONALES
// ============================================
async function cargarValores() {
  const target = document.getElementById('valoresList');
  if (!target) return;

  try {
    const valores = await apiFetch('/valores');
    if (!Array.isArray(valores) || valores.length === 0) return;

    target.innerHTML = valores.map((v, i) => `
      <div class="col-6 col-md-4 col-lg-2" data-aos="zoom-in" data-aos-delay="${i * 80}">
        <div class="tarjeta-valor">
          <div class="sello"><i class="${escapeHtml(v.icono)}"></i></div>
          <h4>${escapeHtml(v.titulo)}</h4>
          <p>${escapeHtml(v.descripcion || '')}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar valores:', error);
  }
}

// ============================================
// SERVICIOS INSTITUCIONALES
// ============================================
async function cargarServicios() {
  const target = document.getElementById('serviciosList');
  if (!target) return;

  try {
    const res = await fetch(`${API_BASE_HOST}/api/institucional/servicios`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const servicios = await res.json();
    if (!Array.isArray(servicios) || servicios.length === 0) return;

    target.innerHTML = servicios.map((s, i) => `
      <div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="tarjeta-servicio">
          <div class="icono-servicio">
            <i class="${escapeHtml(s.icono || 'fa-solid fa-star')}"></i>
          </div>
          <div>
            <h4>${escapeHtml(s.nombre)}</h4>
            ${s.descripcion ? `<p class="text-secondary small mb-1">${escapeHtml(s.descripcion)}</p>` : ''}
            ${s.horario ? `<p class="text-muted small mb-0"><i class="fa-regular fa-clock me-1"></i>${escapeHtml(s.horario)}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar servicios:', error);
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }

  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  }

  const anioSpan = document.getElementById('anioActual');
  if (anioSpan) {
    anioSpan.textContent = new Date().getFullYear();
  }

  // Inicializadores de UI (síncronos)
  inicializarNavbarScroll();
  inicializarBotonVolverArriba();
  inicializarContadores();
  inicializarContactoForm();
  inicializarChatbot();

  // Cargas desde API (asíncronas)
  await cargarConfiguracion();
  await cargarOfertaAcademica();
  await cargarGaleria();
  await cargarRequisitosMatricula();
  await cargarNoticias();
  await cargarEventos();
  await cargarNoticiasPagina();
  await cargarEstadisticas();
  await cargarInfoInstitucional();
  await cargarSedes();
  await cargarFaqs();
  await cargarEquipo();
  await cargarValores();
  await cargarServicios();

  // Después de cargar el DOM dinámico
  inicializarPreinscripcion();
});