<script setup>
import { toolRoutes } from '../../router/index.js'
</script>

<template>
  <div>
    <h1 class="page-title">在线工具</h1>
    <p class="page-sub">免费、纯本地计算、无需登录的小工具合集</p>
    <div class="tool-grid">
      <RouterLink
        v-for="t in toolRoutes"
        :key="t.path"
        :to="t.path"
        class="app-card tool-card"
      >
        <div class="tool-icon" v-if="t.meta.icon"><span class="mi">{{ t.meta.icon }}</span></div>
        <h3>{{ t.meta.title }}</h3>
        <p>{{ t.meta.desc }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 28px; font-weight: 800; font-family: var(--font-title); }
.page-sub { color: var(--on-surface-variant); margin: 8px 0 24px; }
.tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.tool-card { display: block; padding: 20px; transition: border-color .15s ease, box-shadow .15s ease; }
.tool-card:hover { text-decoration: none; border-color: var(--primary); box-shadow: 0 4px 16px rgba(0, 137, 123, .12); }
.tool-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-container); color: var(--on-primary-container); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.tool-icon .mi { font-size: 24px; }
.tool-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.tool-card p { font-size: 13px; color: var(--on-surface-variant); line-height: 1.5; }
</style>
