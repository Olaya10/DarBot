const API_BASE = 'http://localhost:8080/api/public';

const escapeHtml = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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
  const galeriaItems = document.querySelectorAll('#galeria-grid .galeria-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCerrar = document.getElementById('lightboxCerrar');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  if (!galeriaItems.length || !lightbox || !lightboxImg) return;

  const imagenesSrc = Array.from(galeriaItems).map(img => img.src);
  let indiceImagenActual = 0;

  const abrirLightbox = (index) => {
    indiceImagenActual = index;
    lightboxImg.src = imagenesSrc[indiceImagenActual];
    lightbox.style.display = 'flex';
  };

  galeriaItems.forEach((img, index) => {
    img.addEventListener('click', () => abrirLightbox(index));
  });

  if (lightboxCerrar) {
    lightboxCerrar.addEventListener('click', () => {
      lightbox.style.display = 'none';
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', () => {
      indiceImagenActual = (indiceImagenActual - 1 + imagenesSrc.length) % imagenesSrc.length;
      lightboxImg.src = imagenesSrc[indiceImagenActual];
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', () => {
      indiceImagenActual = (indiceImagenActual + 1) % imagenesSrc.length;
      lightboxImg.src = imagenesSrc[indiceImagenActual];
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

      const filter = btn.getAttribute('data-filter');
      items.forEach(item => {
        const category = item.getAttribute('data-category');
        item.style.display = (filter === 'all' || category === filter) ? 'block' : 'none';
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
      const response = await fetch('http://localhost:8080/api/chatbot/pregunta', {
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

    const socialLinks = {
      facebook: document.querySelector('a[href*="facebook"]'),
      instagram: document.querySelector('a[href*="instagram"]'),
      youtube: document.querySelector('a[href*="youtube"]'),
    };

    Object.entries(socialLinks).forEach(([key, el]) => {
      if (el && config[key]) {
        el.href = config[key];
      }
    });
  } catch (error) {
    console.warn('No se pudo cargar la configuración pública:', error);
  }
}

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
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.warn('No se pudo cargar la oferta académica:', error);
  }
}

async function cargarGaleria() {
  const target = document.getElementById('galeria-grid');
  if (!target) return;

  try {
    const items = await apiFetch('/galeria');
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

    inicializarGaleriaLightbox();
    inicializarFiltroGaleria();
    inicializarCargarMas();
  } catch (error) {
    console.warn('No se pudo cargar la galería:', error);
  }
}

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

  inicializarNavbarScroll();
  inicializarBotonVolverArriba();
  inicializarContadores();
  inicializarContactoForm();
  inicializarChatbot();

  await cargarConfiguracion();
  await cargarOfertaAcademica();
  await cargarGaleria();
  await cargarRequisitosMatricula();
  inicializarPreinscripcion();
});
