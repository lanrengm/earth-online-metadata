// 工具注册表（对齐 it-tools 模式：搜索 + 网格卡片，新增工具零页面改动）
//
// 新增一个工具的步骤：
//   1. 实现：在 src/components/tools/ 写 React 组件，并在 src/pages/tools/<slug>.astro 建页面挂载
//      （页面 frontmatter 照抄现有页的 draft 守卫，决策 #18）
//   2. 注册：在下方数组加一条 { slug, title, desc, icon, tags, category }
//      未完成暂不上线：加 `draft: true`，生产构建自动隐藏 + 详情页重定向；完成后删掉该行
//   3. 完成：/tools/ 卡片、搜索与侧边栏分类自动生效（category 即侧边栏分组名）
//
// 注意：汇率接口 ledger/ 是 APK 专用，与 web 工具无关，不要注册展示。
import { published } from '../lib/visibility.js';

const allTools = [
  {
    slug: 'life-quest',
    title: '人生主线',
    desc: '把目标拆成可执行任务，勾选推进你的三系人生进度',
    icon: 'account_tree',
    tags: ['人生面板', '目标管理', '任务树'],
    category: '个人成长',
  },
  {
    slug: 'career-earnings',
    title: '生涯收入',
    desc: '输入年龄与月薪，计算到退休还能赚多少',
    icon: 'payments',
    tags: ['收入', '工资', '退休', '计算器'],
    category: '个人成长',
  },
];

export const tools = published(allTools); // 生产构建滤除 draft 条目（决策 #18）
