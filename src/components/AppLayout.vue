<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">File Delivery Monitor</h1>
        </div>
        <div class="header-right">
          <span class="header-subtitle">Dashboard</span>
        </div>
      </div>
    </header>

    <div class="app-body">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <router-link
            v-for="route in routes"
            :key="route.path"
            :to="route.path"
            class="nav-item"
            :class="{ active: $route.path === route.path }"
          >
            <span class="nav-icon">{{ route.icon }}</span>
            <span class="nav-label">{{ route.label }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const routes = computed(() => [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/delivery-monitor', label: 'Delivery Monitor', icon: '📊' },
  { path: '/table', label: 'Table View', icon: '📋' },
  { path: '/table-example', label: 'Table Example', icon: '📑' },
  { path: '/bar', label: 'Bar Chart', icon: '📊' },
  { path: '/line', label: 'Line Chart', icon: '📈' },
  { path: '/donut', label: 'Donut Chart', icon: '🍩' },
  { path: '/gauge', label: 'Gauge', icon: '⚡' },
  { path: '/treemap', label: 'Treemap', icon: '🗺️' },
  { path: '/about', label: 'About', icon: 'ℹ️' }
])
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f8fafc;
}

.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  position: sticky;
  top: 0;
}

.header-content {
  max-width: 100%;
  margin: 0;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  width: 100%;
}

.sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-item.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.nav-label {
  flex: 1;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  background: #f8fafc;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }

  .nav-label {
    font-size: 0.85rem;
  }

  .app-title {
    font-size: 1.3rem;
  }
}
</style>

