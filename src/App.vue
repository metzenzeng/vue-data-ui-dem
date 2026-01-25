<template>
  <div class="app">
    <!-- 导航菜单 -->
    <nav class="app-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>🎯 Vue Data UI</h1>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/visualization" class="nav-link">数据可视化</router-link>
          <router-link to="/workspace" class="nav-link">工作区</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </div>
      </div>
    </nav>

    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script setup>
// App.vue 现在只作为布局组件
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.app-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: rgba(255,255,255,0.3);
  font-weight: 600;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 15px;
  }

  .nav-links {
    width: 100%;
    justify-content: center;
  }

  .nav-brand h1 {
    font-size: 1.2rem;
  }
}
</style>
