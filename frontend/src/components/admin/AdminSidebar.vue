<template>
  <aside class="shared-admin-sidebar">
    <router-link to="/" class="shared-admin-brand" aria-label="Ir al inicio">
      <img src="../../img/logo_dario.png" alt="Logo institucional" />
      <strong>Darío Torregroza Pérez</strong>
      <small>Institución educativa</small>
    </router-link>
    <nav aria-label="Navegación administrativa">
      <router-link to="/dashboard"><span>▦</span> Dashboard</router-link>
      <router-link to="/admin/institucional"><span>⌂</span> Institución</router-link>
      <router-link to="/admin/contenido"><span>▤</span> Contenido</router-link>
      <router-link to="/admin/faq"><span>▣</span> FAQ</router-link>
      <router-link to="/chat"><span>◌</span> Chat</router-link>
      <router-link to="/admin/preguntas"><span>▱</span> Preguntas</router-link>
      <router-link to="/admin/analitica"><span>▥</span> Analítica</router-link>
    </nav>
    <button class="shared-admin-logout" @click="authStore.logout">⇥ &nbsp; Cerrar sesión</button>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
</script>
