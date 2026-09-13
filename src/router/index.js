import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

// 工具路由表（集中注册；新增工具 = 加一个 .vue + 一行此处条目）
export const toolRoutes = [
  // TODO: 后续在线小工具在此追加（注：汇率接口 ledger/ 是给 APK 用的，与 web 无关，不在此展示）
]

const routes = [
  { path: '/', name: 'home', component: Home },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('../views/tools/index.vue'),
    meta: { title: '在线工具' },
  },
  ...toolRoutes,
  // 兜底：未知路径回主页
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
