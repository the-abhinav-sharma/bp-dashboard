import { createRouter, createWebHistory } from 'vue-router';
import authService from '@/services/authService';
import LoginView from '@/components/LoginView.vue';
import RegisterView from '@/components/RegisterView.vue';
import DashboardView from '@/components/BpDashboard.vue';

const routes = [
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginView 
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: RegisterView 
  },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: DashboardView, 
    meta: { requiresAuth: true }
  },
  { 
    path: '/', 
    redirect: '/dashboard' 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Global Navigation Guard
router.beforeEach((to, from, next) => {
  const authenticated = authService.isAuthenticated();

  if (to.meta.requiresAuth && !authenticated) {
    // If route requires auth and user is NOT logged in -> redirect to /login
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && authenticated) {
    // If user is already logged in and tries to go to login/register -> redirect to /dashboard
    next('/dashboard');
  } else {
    next(); // Proceed as normal
  }
});

export default router;