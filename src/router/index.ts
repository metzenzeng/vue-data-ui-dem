import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/treemap',
      name: 'treemap',
      component: () => import('../components/TreemapDemo.vue'),
    },
    {
      path: '/line',
      name: 'line',
      component: () => import('../views/LineChartPage.vue'),
    },
    {
      path: '/donut',
      name: 'donut',
      component: () => import('../views/DonutChartPage.vue'),
    },
    {
      path: '/bar',
      name: 'bar',
      component: () => import('../views/BarChartPage.vue'),
    },
    {
      path: '/gauge',
      name: 'gauge',
      component: () => import('../views/GaugePage.vue'),
    },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TablePage.vue'),
    },
    {
      path: '/table-example',
      name: 'table-example',
      component: () => import('../views/TableExamplePage.vue'),
    },
  ],
})

export default router
