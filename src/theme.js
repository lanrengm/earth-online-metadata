// 全站主题：亮色 / 暗色 / 跟随系统（对齐 eo es_theme 亮暗双主题）
import { reactive } from 'vue'

const STORAGE_KEY = 'eo_theme'
const MODES = ['light', 'dark', 'system']

const state = reactive({
  mode: 'system', // 用户选择：light / dark / system
  effective: 'light', // 实际生效：light / dark
})

const media = window.matchMedia('(prefers-color-scheme: dark)')

function resolve(mode) {
  if (mode === 'system') return media.matches ? 'dark' : 'light'
  return mode
}

function apply() {
  state.effective = resolve(state.mode)
  document.documentElement.setAttribute('data-theme', state.effective)
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  state.mode = MODES.includes(saved) ? saved : 'system'
  apply()
  media.addEventListener('change', apply)
}

export function setTheme(mode) {
  if (!MODES.includes(mode)) return
  state.mode = mode
  localStorage.setItem(STORAGE_KEY, mode)
  apply()
}

/** 循环切换：亮 → 暗 → 跟随系统 */
export function nextTheme() {
  const i = MODES.indexOf(state.mode)
  setTheme(MODES[(i + 1) % MODES.length])
}

export { state }
