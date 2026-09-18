// 工具注册表（对齐 it-tools 模式：搜索 + 网格卡片，新增工具零页面改动）
//
// 新增一个工具的步骤：
//   1. 实现：在 src/components/tools/ 写 React 组件，并在 src/pages/tools/<slug>.astro 建页面挂载
//   2. 注册：在下方数组加一条 { slug, title, desc, icon, tags }
//   3. 完成：/tools/ 卡片与搜索自动生效
//
// 注意：汇率接口 ledger/ 是 APK 专用，与 web 工具无关，不要注册展示。
export const tools = [
  // 示例（首个真实工具上架时替换）：
  // {
  //   slug: 'age-battery',
  //   title: '年龄电量',
  //   desc: '输入出生日期，看看人生的电量还剩多少',
  //   icon: 'battery_horiz_075',
  //   tags: ['人生面板'],
  // },
];
