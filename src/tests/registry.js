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
  {
    slug: 'auditory-reaction',
    title: '听觉反应',
    desc: '听到提示音的瞬间点击，5 轮取中位数',
    icon: 'volume_up',
    tags: ['反应速度', '听觉', '声音'],
  },
  {
    slug: 'stroop',
    title: 'Stroop 干扰',
    desc: '按字的颜色选择，无视字义干扰',
    icon: 'palette',
    tags: ['干扰抑制', '注意力', '颜色'],
  },
  {
    slug: 'visual-search',
    title: '视觉搜索',
    desc: '在一堆干扰符号中找出唯一目标',
    icon: 'grid_view',
    tags: ['注意力', '目标搜索', '视觉'],
  },
  {
    slug: 'time-perception',
    title: '时间感知',
    desc: '不看钟，凭感觉估出目标时长后停止',
    icon: 'schedule',
    tags: ['时间感知', '内部时钟', '估计'],
  },
  {
    slug: 'mental-rotation',
    title: '心理旋转',
    desc: '判断旋转后的图形是同一个还是镜像',
    icon: 'rotate_right',
    tags: ['空间能力', '旋转', '心理旋转'],
  },
  {
    slug: 'n-back',
    title: 'N-back 记忆',
    desc: '当前字母是否与 2 步前相同？测工作记忆更新',
    icon: 'repeat',
    tags: ['工作记忆', 'N-back', '更新'],
  },
];
