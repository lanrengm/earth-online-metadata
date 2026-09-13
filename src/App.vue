<script setup>
import { RouterLink } from 'vue-router'
import AppNav from './components/AppNav.vue'
</script>

<template>
  <div class="app-shell">
    <AppNav />
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>© 2026 Earth Online（人生面板）· 全本地运行，零隐私收集</p>
      <nav>
        <RouterLink to="/privacy">隐私政策</RouterLink>
        <RouterLink to="/terms">用户协议</RouterLink>
      </nav>
    </footer>
  </div>
</template>
