<template>
  <div class="home-shell">
    <header class="site-header" :class="{ 'header-scrolled': scrolled }">
      <div class="header-inner">
        <router-link to="/" class="brand" aria-label="Inicio"><img class="brand-logo" src="../img/logo_dario.png" alt="Logo de la Institución Educativa Darío Torregroza Pérez" /><span><strong>Dario Torregroza Perez</strong><small>Institución Educativa</small></span></router-link>
        <nav class="site-nav" :class="{ open: menuAbierto }">
          <a href="#institucion" @click.prevent="scrollTo('institucion')">Institución</a>
          <a href="#noticias" @click.prevent="scrollTo('noticias')">Noticias</a>
          <a href="#agenda" @click.prevent="scrollTo('agenda')">Agenda</a>
          <a href="#contacto" @click.prevent="scrollTo('contacto')">Contacto</a>
          <router-link to="/login" class="nav-action" @click="menuAbierto = false">Acceso institucional</router-link>
        </nav>
        <button class="menu-button" aria-label="Abrir menú" @click="menuAbierto = !menuAbierto"><span v-if="!menuAbierto">☰</span><span v-else>✕</span></button>
      </div>
    </header>

    <main>
      <section class="hero"><div class="hero-content"><div class="hero-text"><p class="eyebrow">Educación que transforma</p><h1>Darío Torregroza Pérez</h1><p class="hero-lead">Una comunidad educativa que aprende, convive y construye futuro desde el territorio.</p><div class="hero-actions"><a href="#institucion" class="primary-button" @click.prevent="scrollTo('institucion')">Conoce nuestra institución <span>↘</span></a><a href="#noticias" class="text-link" @click.prevent="scrollTo('noticias')">Ver noticias</a></div></div><div class="hero-shield"><div class="shield-frame"><img src="../img/logo_dario.png" alt="Escudo institucional" /></div></div></div><div class="hero-note"><span>01</span><p>Formación integral<br>con sentido humano</p></div></section>

      <section id="institucion" class="intro-section section-wrap reveal-section"><div class="section-kicker">Nuestra institución</div><div class="intro-grid"><div><h2>Crecer juntos,<br><em>llegar más lejos.</em></h2></div><div><p class="intro-text">{{ info.descripcion || 'Somos una institución educativa comprometida con el desarrollo integral de nuestros estudiantes y el fortalecimiento de nuestra comunidad.' }}</p><a href="#mision-vision" class="inline-link" @click.prevent="scrollTo('mision-vision')">Conoce nuestro propósito <span>→</span></a></div></div></section>

      <section id="mision-vision" class="purpose-section reveal-section"><div class="section-wrap purpose-grid"><article class="purpose-card"><span class="purpose-icon">◎</span><span class="number">01</span><h3>Misión</h3><p>{{ info.mision || 'Nuestra misión será publicada próximamente.' }}</p></article><article class="purpose-card"><span class="purpose-icon">◌</span><span class="number">02</span><h3>Visión</h3><p>{{ info.vision || 'Nuestra visión será publicada próximamente.' }}</p></article><article class="purpose-card"><span class="purpose-icon">✦</span><span class="number">03</span><h3>Valores</h3><p>{{ info.valores || 'Respeto, responsabilidad, solidaridad y excelencia.' }}</p></article></div></section>

      <section id="noticias" class="section-wrap content-section reveal-section"><div class="section-heading"><div><div class="section-kicker">Lo que está pasando</div><h2>Actualidad</h2></div><span class="heading-line"></span></div><div v-if="noticias.length" class="news-grid"><article v-for="noticia in noticias.slice(0, 3)" :key="noticia.id" class="news-card"><div class="news-visual"><span>NOTICIA</span><b>↗</b></div><div class="news-date">{{ fecha(noticia.fechaPublicacion) }}</div><h3>{{ noticia.titulo }}</h3><p>{{ noticia.resumen || noticia.contenido }}</p><span class="card-arrow">↗</span></article></div><p v-else class="empty-state">Próximamente encontrarás aquí las noticias de nuestra comunidad.</p></section>

      <section id="agenda" class="agenda-section reveal-section"><div class="section-wrap"><div class="section-heading light"><div><div class="section-kicker">No te lo pierdas</div><h2>Próximos eventos</h2></div></div><div v-if="eventos.length" class="event-list"><article v-for="evento in eventos.slice(0, 3)" :key="evento.id"><time><strong>{{ dia(evento.fecha) }}</strong><span>{{ mes(evento.fecha) }}</span></time><div><h3>{{ evento.titulo }}</h3><p>{{ evento.lugar || 'Información institucional' }}<span v-if="evento.horaInicio"> · {{ evento.horaInicio }}</span></p></div><span class="card-arrow">→</span></article></div><p v-else class="empty-state light-text">No hay eventos próximos publicados.</p></div></section>

      <section id="contacto" class="contact-section reveal-section"><div class="section-wrap contact-grid"><div><div class="section-kicker">Estamos para escucharte</div><h2>Hablemos.</h2></div><div><p>{{ info.descripcion || 'Comunícate con nuestra institución para conocer nuestra oferta y resolver tus inquietudes.' }}</p><p v-if="info.telefonoGeneral">☎ {{ info.telefonoGeneral }}</p><p v-if="info.correoGeneral">✉ {{ info.correoGeneral }}</p><p v-if="info.sitioWeb"><a :href="info.sitioWeb" target="_blank" rel="noreferrer">{{ info.sitioWeb }}</a></p></div></div></section>
    </main>

    <footer class="site-footer"><div class="section-wrap footer-grid"><div class="brand footer-brand"><img class="brand-logo" src="../img/logo_dario.png" alt="Logo de la Institución Educativa Darío Torregroza Pérez" /><span><strong>Dario Torregroza Perez</strong><small>Institución Educativa</small></span><p>Educación con propósito.</p></div><div><h4>Explora</h4><a href="#institucion" @click.prevent="scrollTo('institucion')">Institución</a><a href="#noticias" @click.prevent="scrollTo('noticias')">Noticias</a><a href="#agenda" @click.prevent="scrollTo('agenda')">Eventos</a></div><div><h4>Conecta</h4><a v-if="info.correoGeneral" :href="`mailto:${info.correoGeneral}`">{{ info.correoGeneral }}</a><a v-if="info.telefonoGeneral" :href="`tel:${info.telefonoGeneral}`">{{ info.telefonoGeneral }}</a><span class="social-links"><a href="#contacto" aria-label="Facebook" @click.prevent="scrollTo('contacto')">f</a><a href="#contacto" aria-label="Instagram" @click.prevent="scrollTo('contacto')">◎</a><a href="#contacto" aria-label="YouTube" @click.prevent="scrollTo('contacto')">▶</a></span></div><div class="footer-access"><router-link to="/login" class="footer-login">Acceso institucional →</router-link><span>© 2026 Dario Torregroza Perez</span></div></div></footer>
    <ChatWidget />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import api from '../services/api'
import ChatWidget from '../components/chatbot/ChatWidget.vue'
import '../assets/home.css'

const info = ref({})
const noticias = ref([])
const eventos = ref([])
const menuAbierto = ref(false)
const scrolled = ref(false)
const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Actualidad'
const dia = (valor) => valor ? new Date(`${valor}T00:00:00`).getDate() : '--'
const mes = (valor) => valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase() : 'PRÓX.'
const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); menuAbierto.value = false }
let revealObserver
const updateHeader = () => { scrolled.value = window.scrollY > 20 }

onMounted(async () => {
  window.addEventListener('scroll', updateHeader, { passive: true })
  const respuestas = await Promise.allSettled([api.get('/api/institucional/info'), api.get('/api/contenidos/noticias'), api.get('/api/contenidos/eventos')])
  if (respuestas[0].status === 'fulfilled' && respuestas[0].value.data) info.value = respuestas[0].value.data
  if (respuestas[1].status === 'fulfilled') noticias.value = respuestas[1].value.data || []
  if (respuestas[2].status === 'fulfilled') eventos.value = respuestas[2].value.data || []
  revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) } }), { threshold: 0.12 })
  document.querySelectorAll('.reveal-section').forEach((section) => revealObserver.observe(section))
})

onUnmounted(() => { revealObserver?.disconnect(); window.removeEventListener('scroll', updateHeader) })
</script>
