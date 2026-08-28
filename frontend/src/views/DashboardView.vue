<template>
  <div class="admin-dashboard">
    <aside class="admin-sidebar" :class="{ 'sidebar-hidden': !sidebarVisible }">
      <router-link to="/" class="admin-brand" aria-label="Ir al inicio">
        <img src="../img/logo_dario.png" alt="Logo institucional" />
        <strong>Darío Torregroza Pérez</strong>
        <small>Institución educativa</small>
      </router-link>
      <nav class="admin-nav" aria-label="Navegación administrativa">
        <router-link to="/dashboard" class="active"><span>▦</span> Dashboard</router-link>
        <router-link to="/admin/institucional"><span>⌂</span> Institución <b>⌄</b></router-link>
        <router-link to="/admin/contenido"><span>▤</span> Contenido</router-link>
        <router-link to="/admin/faq"><span>▣</span> Académico <b>⌄</b></router-link>
        <router-link to="/chat"><span>◌</span> Comunicaciones <b>⌄</b></router-link>
        <router-link to="/admin/preguntas"><span>▱</span> Preguntas</router-link>
        <router-link to="/admin/analitica"><span>▥</span> Reportes</router-link>
      </nav>
      <div class="dashboard-logout-box">
        <span>Sesión activa</span>
        <button class="dashboard-logout" @click="authStore.logout">⇥ &nbsp; Cerrar sesión</button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <button class="menu-toggle" :class="{ 'menu-open': sidebarVisible }" :aria-label="sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'" @click="sidebarVisible = !sidebarVisible">{{ sidebarVisible ? '‹' : '☰' }}</button>
        <div class="topbar-actions">
          <div class="notification-wrap"><button class="notification" :aria-label="`${preguntasPendientes.length} preguntas sin responder`" @click="notificacionesAbiertas = !notificacionesAbiertas">♧<i v-if="preguntasPendientes.length">{{ preguntasPendientes.length }}</i></button><div v-if="notificacionesAbiertas" class="notification-popover"><strong>Preguntas sin responder</strong><p v-if="!preguntasPendientes.length">No hay preguntas nuevas.</p><template v-else><p>{{ preguntasPendientes.length }} pregunta{{ preguntasPendientes.length === 1 ? '' : 's' }} requiere{{ preguntasPendientes.length === 1 ? '' : 'n' }} atención.</p><router-link to="/admin/preguntas" @click="notificacionesAbiertas = false">Revisar preguntas</router-link></template></div></div>
          <span class="avatar">{{ initials }}</span>
          <span class="user-info"><strong>{{ authStore.user?.username || 'Administrador' }}</strong><small>Rol: Administrador</small></span>
        </div>
      </header>

      <main class="admin-content">
        <div class="welcome-row">
          <div><p class="overline">Resumen general</p><h1>Bienvenido, <em>{{ authStore.user?.username || 'Administrador' }}</em></h1><p>Administra y consulta la información de tu institución.</p></div>
          <time>▣ &nbsp; {{ fechaActual }}</time>
        </div>

        <section class="metric-grid" aria-label="Indicadores">
          <article class="metric-card metric-red"><span class="metric-icon">♟</span><div><small>Preguntas recibidas</small><strong>{{ estadisticas.total || 0 }}</strong><p>↑ <b>8.5%</b> vs. mes anterior</p></div></article>
          <article class="metric-card metric-yellow"><span class="metric-icon">★</span><div><small>Feedback positivo</small><strong>{{ estadisticas.positivos || 0 }}</strong><p>↑ <b>3.2%</b> vs. mes anterior</p></div></article>
          <article class="metric-card metric-green" title="Porcentaje de valoraciones positivas sobre el total de feedback"><span class="metric-icon">▣</span><div><small>Tasa de aprobación <b class="info-mark">i</b></small><strong>{{ estadisticas.tasa || 0 }}%</strong><p>{{ estadisticas.positivos || 0 }} positivas de {{ estadisticas.total || 0 }} valoraciones</p></div></article>
          <article class="metric-card metric-purple" title="Módulos con información disponible en el panel"><span class="metric-icon">▤</span><div><small>Secciones con datos <b class="info-mark">i</b></small><strong>{{ seccionesActivas }}</strong><p>de {{ totalSecciones }} módulos consultados</p></div></article>
        </section>

        <section class="dashboard-grid">
          <article class="dashboard-panel quick-panel"><div class="panel-heading"><h2>Acceso rápido</h2></div><div class="quick-grid">
            <router-link to="/chat" class="quick-item quick-chat"><span>◯</span><b>Chat</b></router-link>
            <router-link to="/admin/faq" class="quick-item quick-faq"><span>?</span><b>FAQ</b></router-link>
            <router-link to="/admin/contenido" class="quick-item quick-content"><span>▤</span><b>Contenido</b></router-link>
            <router-link to="/admin/analitica" class="quick-item quick-report"><span>▥</span><b>Analítica</b></router-link>
            <router-link to="/admin/intenciones" class="quick-item quick-intent"><span>◎</span><b>Intenciones</b></router-link>
            <router-link to="/admin/sinonimos" class="quick-item quick-synonym"><span>▤</span><b>Sinónimos</b></router-link>
            <router-link to="/admin/preguntas" class="quick-item quick-questions"><span>?</span><b>Preguntas sin respuesta</b></router-link>
            <router-link to="/admin/institucional" class="quick-item quick-school"><span>⌂</span><b>Información institucional</b></router-link>
          </div></article>
          <article class="dashboard-panel activity-panel"><div class="panel-heading"><h2>Actividad reciente</h2><router-link to="/admin/preguntas">Ver todo</router-link></div><div class="activity-list"><div v-if="preguntasPendientes.length"><span class="activity-icon orange">◯</span><p><b>Nueva pregunta sin responder</b><small>{{ preguntasPendientes[0].pregunta }}</small></p><time>{{ tiempoRelativo(preguntasPendientes[0].fecha) }}</time></div><div v-else><span class="activity-icon green">✓</span><p><b>Todo al día</b><small>No hay preguntas pendientes de respuesta.</small></p><time>Ahora</time></div><div><span class="activity-icon blue">▤</span><p><b>Contenido disponible</b><small>{{ contenidoCount }} publicaciones registradas</small></p><time>Actualizado</time></div><div><span class="activity-icon purple">▣</span><p><b>Feedback recibido</b><small>{{ estadisticas.total || 0 }} valoraciones registradas</small></p><time>Actualizado</time></div></div></article>
        </section>

        <section class="dashboard-grid lower-grid"><article class="dashboard-panel chart-panel"><div class="panel-heading"><div><h2>Resumen de feedback</h2><small class="panel-hint">Valoraciones de los últimos 7 días</small></div></div><div v-if="datosGrafica.length" class="real-chart"><div v-for="dia in datosGrafica" :key="dia.fecha" class="chart-column"><span>{{ dia.total }}</span><div class="chart-bar" :style="{ height: `${dia.altura}%` }" :title="`${dia.total} valoraciones el ${dia.etiqueta}`"></div><small>{{ dia.etiqueta }}</small></div></div><p v-else class="empty-dashboard">Aún no hay feedback suficiente para mostrar una tendencia.</p></article><article class="dashboard-panel events-panel"><div class="panel-heading"><h2>Próximos eventos</h2><router-link to="/admin/contenido">Ver calendario</router-link></div><div v-if="eventos.length" class="event-list"><div v-for="evento in eventos.slice(0, 3)" :key="evento.id"><time><b>{{ diaEvento(evento.fecha) }}</b><small>{{ mesEvento(evento.fecha) }}</small></time><p><b>{{ evento.titulo }}</b><small>{{ evento.horaInicio || 'Todo el día' }}<span v-if="evento.lugar"> · {{ evento.lugar }}</span></small></p><span>⋮</span></div></div><p v-else class="empty-dashboard">No hay próximos eventos publicados.</p></article></section>
      </main>
    </div>
    <ChatWidget />
  </div>
</template>

<style scoped>
:global(body) { background: #f6f7f9; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; color: #24252b; }
.admin-dashboard { --red: #d9363e; --ink: #25262c; --muted: #747780; min-height: 100vh; display: flex; background: #f6f7f9; }
.admin-sidebar { width: 208px; min-height: 100vh; padding: 22px 10px 18px; display: flex; flex-direction: column; color: #fff; background: linear-gradient(145deg, #e23e46 0%, #cb2934 58%, #b61f2b 100%); position: relative; overflow: hidden; }
.admin-sidebar::after { content: ''; position: absolute; width: 250px; height: 250px; left: -105px; bottom: -35px; border: 1px solid rgba(255,255,255,.09); transform: rotate(45deg); box-shadow: 0 0 0 42px rgba(255,255,255,.04), 0 0 0 84px rgba(255,255,255,.025); pointer-events: none; }
.admin-brand { display: flex; flex-direction: column; align-items: center; color: #fff; text-decoration: none; position: relative; z-index: 1; }
.admin-brand img { width: 67px; height: 67px; object-fit: contain; filter: drop-shadow(0 6px 5px rgba(70,0,4,.2)); margin-bottom: 10px; }
.admin-brand strong { font-size: 13px; text-align: center; letter-spacing: .01em; }
.admin-brand small { margin-top: 5px; color: #ffd9db; font-size: 8px; text-transform: uppercase; letter-spacing: .16em; }
.admin-nav { margin-top: 28px; position: relative; z-index: 1; }
.admin-nav a { display: flex; align-items: center; gap: 12px; min-height: 39px; padding: 0 12px; color: #fff; border-radius: 7px; text-decoration: none; font-size: 11px; transition: background .18s, transform .18s; }
.admin-nav a:hover, .admin-nav a.active { background: rgba(132, 13, 24, .4); transform: translateX(2px); }
.admin-nav a span { width: 15px; text-align: center; font-size: 18px; line-height: 1; }
.admin-nav a b { margin-left: auto; font-size: 15px; font-weight: normal; opacity: .9; }
.dashboard-logout-box { margin-top: auto; padding: 14px 12px 12px; border-radius: 7px; background: rgba(128,13,24,.42); position: relative; z-index: 1; }
.dashboard-logout-box > span { display: block; margin-bottom: 9px; color: #ffd9db; font-size: 10px; }
.dashboard-logout { width: 100%; padding: 9px 10px; border: 1px solid rgba(255,255,255,.14); border-radius: 5px; color: #fff; background: rgba(255,255,255,.13); cursor: pointer; font: inherit; font-size: 11px; text-align: left; }
.dashboard-logout:hover { background: rgba(255,255,255,.22); }
.support-box { margin-top: auto; padding: 18px 14px 14px; border-radius: 7px; background: rgba(128, 13, 24, .42); position: relative; z-index: 1; font-size: 10px; }
.support-box strong { font-size: 11px; }.support-box p { color: #ffd9db; line-height: 1.6; margin: 8px 0 13px; }
.support-box a { display: flex; justify-content: space-between; align-items: center; padding: 9px 10px; border-radius: 5px; color: #fff; text-decoration: none; background: rgba(255,255,255,.13); font-size: 10px; }
.support-box a:hover { background: rgba(255,255,255,.22); }
.admin-main { min-width: 0; flex: 1; }
.admin-topbar { height: 60px; padding: 0 38px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #ececef; }
.menu-toggle { border: 0; background: transparent; color: #666a70; font-size: 21px; cursor: pointer; }
.topbar-actions { display: flex; align-items: center; gap: 15px; }
.view-site { color: var(--red); font-size: 11px; text-decoration: none; }.view-site:hover { text-decoration: underline; }
.notification { color: #6a6d75; font-size: 20px; position: relative; }.notification i { position: absolute; top: -7px; right: -8px; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; color: #fff; background: var(--red); font-size: 8px; font-style: normal; }
.avatar { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--red); color: #fff; font-size: 10px; font-weight: bold; }.user-info { display: flex; flex-direction: column; gap: 3px; }.user-info strong { font-size: 11px; }.user-info small { color: #8b8e95; font-size: 9px; }.logout-button { border: 0; background: transparent; color: #666; cursor: pointer; font-size: 17px; }
.admin-content { width: min(100% - 76px, 1150px); margin: 0 auto; padding: 30px 0 45px; }
.welcome-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }.overline { color: #8a8d95; font-size: 10px; margin: 0 0 7px; text-transform: uppercase; letter-spacing: .15em; }.welcome-row h1 { margin: 0; font-size: 21px; letter-spacing: -.03em; }.welcome-row h1 em { color: var(--red); font-style: normal; }.welcome-row > div > p:last-child { margin: 7px 0 0; color: #858890; font-size: 11px; }.welcome-row time { padding: 9px 14px; border: 1px solid #e6e7ea; border-radius: 5px; background: #fff; color: #464950; font-size: 10px; white-space: nowrap; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 19px; }.metric-card { min-height: 115px; padding: 18px 15px; display: flex; align-items: flex-start; gap: 12px; background: #fff; border: 1px solid #ebeced; border-radius: 8px; box-shadow: 0 2px 6px rgba(35,40,48,.025); }.metric-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; }.metric-card small { display: block; color: #71747b; font-size: 10px; }.metric-card strong { display: block; margin: 5px 0 4px; color: #17181c; font-size: 22px; }.metric-card p { margin: 0; color: #1ba36d; font-size: 9px; }.metric-card p b { font-weight: normal; }.metric-red .metric-icon { color: #df3d53; background: #fde9ec; }.metric-yellow .metric-icon { color: #f2a81d; background: #fff3d7; }.metric-green .metric-icon { color: #22b878; background: #e3f8ee; }.metric-purple .metric-icon { color: #944ee8; background: #f2e8ff; }
.dashboard-grid { display: grid; grid-template-columns: 1.08fr .92fr; gap: 15px; margin-bottom: 15px; }.dashboard-panel { min-width: 0; padding: 17px; border: 1px solid #e9eaed; border-radius: 8px; background: #fff; box-shadow: 0 2px 6px rgba(35,40,48,.025); }.panel-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }.panel-heading h2 { margin: 0; font-size: 13px; }.panel-heading a { color: var(--red); font-size: 10px; text-decoration: none; }.panel-heading select { border: 1px solid #e4e5e8; border-radius: 4px; padding: 6px 10px; color: #444; font-size: 9px; background: #fff; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }.quick-item { min-height: 77px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; border-radius: 7px; color: #25262c; text-decoration: none; text-align: center; transition: transform .18s, box-shadow .18s; }.quick-item:hover { transform: translateY(-3px); box-shadow: 0 7px 14px rgba(38,42,49,.1); }.quick-item span { font-size: 25px; line-height: 1; }.quick-item b { max-width: 100px; font-size: 10px; font-weight: 600; }.quick-chat { color: #f04455; background: #fff0f2; }.quick-faq { color: #16a972; background: #edf9f4; }.quick-content { color: #ed4d54; background: #fff1f1; }.quick-report { color: #f18b31; background: #fff5e9; }.quick-intent { color: #8d4ee6; background: #f5efff; }.quick-synonym { color: #4589dc; background: #eef6ff; }.quick-questions { color: #efa515; background: #fff7e9; }.quick-school { color: #ef5965; background: #fff0f2; }
.activity-list > div { min-height: 42px; display: flex; align-items: center; gap: 10px; }.activity-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; font-size: 16px; }.activity-icon.blue { color: #3985e9; background: #eaf3ff; }.activity-icon.green { color: #27b477; background: #e8f9f1; }.activity-icon.purple { color: #9750ea; background: #f2eaff; }.activity-icon.orange { color: #ed8e2f; background: #fff2e3; }.activity-list p { display: flex; flex-direction: column; gap: 3px; margin: 0; min-width: 0; flex: 1; }.activity-list b { font-size: 10px; }.activity-list small { overflow: hidden; color: #878a91; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.activity-list time { color: #8d9096; font-size: 8px; white-space: nowrap; }
.lower-grid { grid-template-columns: 1.08fr .92fr; }.fake-chart { height: 155px; display: flex; padding-top: 8px; }.chart-labels { width: 25px; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 22px; color: #93969b; font-size: 8px; }.chart-area { flex: 1; position: relative; border-bottom: 1px solid #e5e7e9; background: repeating-linear-gradient(to bottom, transparent 0, transparent 29px, #eef0f2 30px); }.chart-line { position: absolute; left: 0; right: 0; bottom: 20px; height: 75px; clip-path: polygon(0 80%, 5% 68%, 10% 62%, 15% 43%, 20% 12%, 25% 4%, 30% 42%, 35% 58%, 40% 50%, 45% 55%, 50% 43%, 55% 55%, 60% 40%, 65% 20%, 70% 45%, 75% 57%, 80% 78%, 85% 65%, 90% 38%, 95% 12%, 100% 50%, 100% 53%, 95% 15%, 90% 41%, 85% 68%, 80% 81%, 75% 60%, 70% 48%, 65% 24%, 60% 44%, 55% 59%, 50% 46%, 45% 58%, 40% 53%, 35% 62%, 30% 46%, 25% 8%, 20% 16%, 15% 47%, 10% 66%, 5% 72%, 0 84%); background: #e3424a; z-index: 2; }.chart-fill { position: absolute; inset: 70px 0 0; background: linear-gradient(to bottom, rgba(227,66,74,.2), rgba(227,66,74,0)); clip-path: polygon(0 16%, 5% 4%, 10% 0, 15% 0, 20% 0, 25% 0, 30% 0, 35% 0, 40% 0, 45% 0, 50% 0, 55% 0, 60% 0, 65% 0, 70% 0, 75% 0, 80% 0, 85% 0, 90% 0, 95% 0, 100% 0, 100% 100%, 0 100%); }.chart-date { position: absolute; bottom: -19px; color: #8d9096; font-size: 8px; }.date-one { left: 0; }.date-two { left: 19%; }.date-three { left: 39%; }.date-four { left: 59%; }.date-five { left: 79%; }.date-six { right: 0; }
.event-list > div { display: flex; align-items: center; gap: 12px; padding: 7px 0; }.event-list time { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 39px; height: 43px; border: 1px solid #e7e9ec; border-radius: 5px; flex-shrink: 0; }.event-list time b { color: var(--red); font-size: 16px; }.event-list time small { color: #777b83; font-size: 8px; }.event-list p { display: flex; flex-direction: column; gap: 4px; flex: 1; margin: 0; }.event-list p b { font-size: 10px; }.event-list p small { color: #85888e; font-size: 9px; }.event-list > div > span { color: #666; font-size: 18px; }
/* Estados funcionales y escala de lectura */
.admin-sidebar { transition: width .25s ease, padding .25s ease, opacity .2s ease; }
.admin-sidebar.sidebar-hidden { width: 0; padding-left: 0; padding-right: 0; opacity: 0; pointer-events: none; }
.menu-toggle.menu-open { font-size: 28px; line-height: 1; }
.admin-nav a { font-size: 13px; }
.welcome-row h1 { font-size: 25px; }
.welcome-row > div > p:last-child { font-size: 13px; }
.welcome-row time { font-size: 12px; }
.metric-card small { font-size: 12px; }
.metric-card strong { font-size: 25px; }
.metric-card p { font-size: 11px; line-height: 1.35; }
.info-mark { display: inline-grid; place-items: center; width: 14px; height: 14px; margin-left: 3px; border: 1px solid currentColor; border-radius: 50%; font-size: 9px; font-weight: normal; }
.notification-wrap { position: relative; }
.notification { border: 0; background: transparent; cursor: pointer; }
.notification i { min-width: 14px; padding: 0 3px; }
.notification-popover { position: absolute; z-index: 5; top: 34px; right: -5px; width: 220px; padding: 14px; border: 1px solid #ececef; border-radius: 7px; background: #fff; box-shadow: 0 10px 25px rgba(35,40,48,.14); }
.notification-popover strong { display: block; font-size: 12px; }
.notification-popover p { margin: 7px 0 10px; color: #777b83; font-size: 11px; line-height: 1.45; }
.notification-popover a { color: var(--red); font-size: 11px; text-decoration: none; }
.panel-hint { display: block; margin-top: 4px; color: #8b8e95; font-size: 10px; font-weight: normal; }
.real-chart { height: 175px; display: flex; align-items: flex-end; gap: 10px; padding: 12px 8px 0 4px; border-bottom: 1px solid #e5e7e9; background: repeating-linear-gradient(to bottom, transparent 0, transparent 32px, #eef0f2 33px); }
.chart-column { display: flex; align-items: center; flex: 1; flex-direction: column; justify-content: flex-end; height: 100%; gap: 5px; color: #8d9096; font-size: 9px; }
.chart-column > span { height: 12px; color: #5b5e66; font-size: 9px; }
.chart-bar { width: min(25px, 75%); min-height: 3px; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, #ef5962, #d9363e); box-shadow: 0 3px 7px rgba(217,54,62,.18); }
.chart-column small { height: 14px; font-size: 9px; }
.empty-dashboard { margin: 18px 0 5px; color: #85888e; font-size: 12px; }
@media (max-width: 900px) { .admin-sidebar { width: 180px; }.admin-content { width: min(100% - 40px, 1150px); }.metric-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 680px) { .admin-dashboard { display: block; }.admin-sidebar { width: 100%; min-height: auto; padding: 13px 14px; }.admin-sidebar.sidebar-hidden { display: none; }.admin-brand img { width: 48px; height: 48px; margin-bottom: 5px; }.admin-brand strong { font-size: 12px; }.admin-brand small { font-size: 7px; }.admin-nav { display: flex; gap: 5px; margin-top: 14px; overflow-x: auto; }.admin-nav a { min-width: max-content; padding: 0 9px; }.admin-nav a b { display: none; }.dashboard-logout-box { margin-top: 12px; }.dashboard-logout { padding: 8px 10px; }.support-box { display: none; }.admin-topbar { height: 54px; padding: 0 18px; }.view-site { display: none; }.user-info { display: none; }.admin-content { width: calc(100% - 28px); padding: 24px 0 35px; }.welcome-row { align-items: flex-start; flex-direction: column; gap: 15px; }.welcome-row h1 { font-size: 21px; }.metric-grid, .dashboard-grid, .lower-grid { grid-template-columns: 1fr; }.metric-grid { gap: 10px; }.metric-card { min-height: 100px; }.quick-grid { gap: 8px; }.quick-item { min-height: 70px; }.quick-item b { font-size: 10px; }.dashboard-panel { padding: 14px; }.notification-popover { right: -65px; } }
</style>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { chatbotService } from '../services/chatbot'
import api from '../services/api'
import ChatWidget from '../components/chatbot/ChatWidget.vue'

const authStore = useAuthStore()
const estadisticas = ref({})
const preguntasPendientes = ref([])
const eventos = ref([])
const contenidoCount = ref(0)
const seccionesActivas = ref(0)
const sidebarVisible = ref(true)
const notificacionesAbiertas = ref(false)
const totalSecciones = 4
const initials = computed(() => (authStore.user?.username || 'AD').slice(0, 2).toUpperCase())
const fechaActual = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
let notificacionesTimer
const datosGrafica = computed(() => { const diario = estadisticas.value.ultimos_7_dias || {}; const dias = Object.entries(diario).sort(([a], [b]) => a.localeCompare(b)); const maximo = Math.max(...dias.map(([, valor]) => (valor.positivos || 0) + (valor.negativos || 0)), 1); return dias.map(([fecha, valor]) => { const total = (valor.positivos || 0) + (valor.negativos || 0); return { fecha, total, altura: Math.max(total ? 8 : 2, total / maximo * 100), etiqueta: new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '') } }) })
const diaEvento = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).getDate() : '--'
const mesEvento = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase() : 'PRÓX.'
const tiempoRelativo = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente'

async function cargarPreguntasPendientes() {
  const respuesta = await api.get('/api/admin/chatbot/preguntas?resuelta=false')
  preguntasPendientes.value = respuesta.data || []
}

onMounted(async () => {
  try {
    const [estadisticasData, preguntasData, eventosData, faqData, intencionesData, sinonimosData, contenidoData] = await Promise.allSettled([
      chatbotService.obtenerEstadisticas(),
      api.get('/api/admin/chatbot/preguntas?resuelta=false'),
      api.get('/api/contenidos/eventos'),
      api.get('/api/admin/chatbot/faqs'),
      api.get('/api/admin/chatbot/intenciones'),
      api.get('/api/admin/chatbot/sinonimos'),
      api.get('/api/admin/contenidos/noticias')
    ])
    const data = estadisticasData.status === 'fulfilled' ? estadisticasData.value : {}
    estadisticas.value = {
      total: data.total_feedback || 0,
      positivos: data.positivos || 0,
      tasa: Math.round(data.tasa_aprobacion || 0)
    }
    preguntasPendientes.value = preguntasData.status === 'fulfilled' ? preguntasData.value.data || [] : []
    eventos.value = eventosData.status === 'fulfilled' ? eventosData.value.data || [] : []
    contenidoCount.value = contenidoData.status === 'fulfilled' ? (contenidoData.value.data || []).length : 0
    seccionesActivas.value = [faqData, intencionesData, sinonimosData, contenidoData].filter((respuesta) => respuesta.status === 'fulfilled' && (respuesta.value.data || []).length > 0).length
    notificacionesTimer = window.setInterval(() => cargarPreguntasPendientes().catch(() => {}), 30000)
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
  }
})

onUnmounted(() => window.clearInterval(notificacionesTimer))
</script>
