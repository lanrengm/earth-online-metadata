// 测试注册表（属性检定板块，仿 tools/registry.js：新增测试 = 加条目 + 建页面）
//
// 注意：norm 字段必须如实标注参考分布来源与局限（数据红线见 docs/架构决策.md #16）。
export const tests = [
  {
    slug: 'reaction-time',
    title: '视觉反应',
    desc: '屏幕变绿的瞬间点击，5 轮取中位数',
    icon: 'visibility',
    tags: ['反应速度', '反应时间', '手速'],
  },
  {
    slug: 'choice-reaction',
    title: '选择反应',
    desc: '四个方块随机亮起，点对亮的那个',
    icon: 'filter_alt',
    tags: ['反应速度', '抑制控制', '选择'],
  },
  {
    slug: 'digit-span',
    title: '数字广度',
    desc: '数字闪现后按顺序复现，测工作记忆容量',
    icon: 'timeline',
    tags: ['工作记忆', '记忆', '数字'],
  },
];
