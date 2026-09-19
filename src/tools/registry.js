// 工具注册表（对齐 it-tools 模式：搜索 + 网格卡片，新增工具零页面改动）
//
// 新增一个工具的步骤：
//   1. 实现：在 src/components/tools/ 写 React 组件，并在 src/pages/tools/<slug>.astro 建页面挂载
//   2. 注册：在下方数组加一条 { slug, title, desc, icon, tags, category }
//   3. 完成：/tools/ 卡片、搜索与侧边栏分类自动生效（category 即侧边栏分组名）
//
// 注意：汇率接口 ledger/ 是 APK 专用，与 web 工具无关，不要注册展示。
export const tools = [
  {
    slug: 'life-quest',
    title: '人生主线',
    desc: '把目标拆成可执行任务，勾选推进你的三系人生进度',
    icon: 'account_tree',
    tags: ['人生面板', '目标管理', '任务树'],
    category: '个人成长',
  },
];
