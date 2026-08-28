<template>
  <AdminSidebar v-if="mostrarSidebar" />
  <router-view />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from './components/admin/AdminSidebar.vue'

const route = useRoute()
const mostrarSidebar = computed(() => route.path !== '/dashboard' && route.path !== '/' && route.path !== '/login')
</script>
