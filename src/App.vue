<script setup>
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
        <a href="privacy.html">隐私政策</a>
        <a href="terms.html">用户协议</a>
      </nav>
    </footer>
  </div>
</template>
