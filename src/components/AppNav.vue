<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { state, nextTheme } from '../theme'

const themeLabel = computed(() =>
  state.mode === 'system' ? '跟随系统' : state.mode === 'light' ? '亮色' : '暗色',
)
</script>

<template>
  <header class="app-nav">
    <div class="app-nav-inner">
      <RouterLink to="/" class="app-nav-brand">Earth Online</RouterLink>
      <nav class="app-nav-right">
        <nav class="app-nav-links">
          <RouterLink to="/"><span class="mi">home</span>主页</RouterLink>
          <RouterLink to="/tools"><span class="mi">widgets</span>在线工具</RouterLink>
        </nav>
        <button
          class="theme-btn"
          :title="`点击切换主题（当前：${themeLabel}）`"
          @click="nextTheme()"
        >
          <span class="mi" v-if="state.effective === 'dark'">dark_mode</span>
          <span class="mi" v-else>light_mode</span>
          <span class="theme-label">{{ themeLabel }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-nav-right { display: flex; align-items: center; gap: 20px; }
.app-nav-links a { display: inline-flex; align-items: center; gap: 4px; }
.app-nav-links .mi { font-size: 18px; }
.theme-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--outline-variant);
  background: var(--surface-container-low);
  color: var(--on-surface-variant);
  font-size: 13px; cursor: pointer; font-family: var(--font-body);
  transition: border-color .15s ease, color .15s ease;
}
.theme-btn:hover { border-color: var(--primary); color: var(--primary); }
</style>
