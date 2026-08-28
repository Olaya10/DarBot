import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import DashboardView from '../views/DashboardView.vue'
import ChatView from '../views/ChatView.vue'
import AdminFaqView from '../views/AdminFaqView.vue'
import AdminContenidoView from '../views/AdminContenidoView.vue'
import AdminAnaliticaView from '../views/AdminAnaliticaView.vue'
import AdminIntencionesView from '../views/AdminIntencionesView.vue'
import AdminSinonimosView from '../views/AdminSinonimosView.vue'
import AdminPreguntasView from '../views/AdminPreguntasView.vue'
import HomeView from '../views/HomeView.vue'
import AdminInstitucionalView from '../views/AdminInstitucionalView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/faq',
      name: 'admin-faq',
      component: AdminFaqView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/contenido',
      name: 'admin-contenido',
      component: AdminContenidoView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/analitica',
      name: 'admin-analitica',
      component: AdminAnaliticaView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/intenciones',
      name: 'admin-intenciones',
      component: AdminIntencionesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/sinonimos',
      name: 'admin-sinonimos',
      component: AdminSinonimosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/preguntas',
      name: 'admin-preguntas',
      component: AdminPreguntasView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/institucional',
      name: 'admin-institucional',
      component: AdminInstitucionalView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }
  
  if (to.path === '/login' && authStore.isAuthenticated) {
    return '/dashboard'
  }
})

export default router