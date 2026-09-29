// 测试注册表（天赋检测板块，仿 tools/registry.js：新增测试 = 加条目 + 建页面）
//
// 注意：
// 1. norm 字段必须如实标注参考分布来源与局限（数据红线见 docs/架构决策.md #16）。
// 2. category 为认知领域分组（决策 #17 修订七，采用专业认知域命名），数组顺序即侧栏与
//    页面的分组展示顺序；新增测试请归入对应 category 并插到该组末尾。
// 3. 未完成暂不上线：条目加 `draft: true`，生产构建自动隐藏 + 详情页重定向（决策 #18）。
import { published } from '../lib/visibility.js';

const allTests = [
  // ── 加工速度（processing speed）+ 心理运动 ──
  {
    slug: 'reaction-time',
    title: '视觉反应',
    desc: '屏幕变绿的瞬间点击，5 轮取中位数',
    icon: 'visibility',
    category: '加工速度',
    tags: ['反应速度', '反应时间', '手速'],
  },
  {
    slug: 'auditory-reaction',
    title: '听觉反应',
    desc: '听到提示音的瞬间点击，5 轮取中位数',
    icon: 'volume_up',
    category: '加工速度',
    tags: ['反应速度', '听觉', '声音'],
  },
  {
    slug: 'choice-reaction',
    title: '选择反应',
    desc: '四个方块随机亮起，点对亮的那个',
    icon: 'filter_alt',
    category: '加工速度',
    tags: ['反应速度', '抑制控制', '选择'],
  },
  {
    slug: 'aim-trainer',
    title: '手眼精度',
    desc: '目标点随机出现，尽快点掉，30 秒极限',
    icon: 'ads_click',
    category: '加工速度',
    tags: ['手眼协调', '瞄准', '精准'],
  },

  // ── 工作记忆（Gwm）+ 空间认知（Gv） ──
  {
    slug: 'digit-span',
    title: '数字广度',
    desc: '数字闪现后按顺序复现，测工作记忆容量',
    icon: 'timeline',
    category: '工作记忆与空间',
    tags: ['工作记忆', '记忆', '数字'],
  },
  {
    slug: 'n-back',
    title: 'N-back 记忆',
    desc: '当前字母是否与 2 步前相同？测工作记忆更新',
    icon: 'repeat',
    category: '工作记忆与空间',
    tags: ['工作记忆', 'N-back', '更新'],
  },
  {
    slug: 'spatial-memory',
    title: '空间记忆',
    desc: '色块闪现的位置和顺序，凭记忆复现',
    icon: 'view_module',
    category: '工作记忆与空间',
    tags: ['空间记忆', 'Corsi', '位置'],
  },
  {
    slug: 'mental-rotation',
    title: '心理旋转',
    desc: '判断旋转后的图形是同一个还是镜像',
    icon: 'rotate_right',
    category: '工作记忆与空间',
    tags: ['空间能力', '旋转', '心理旋转'],
  },

  // ── 知觉与注意 ──
  {
    slug: 'visual-search',
    title: '视觉搜索',
    desc: '在一堆干扰符号中找出唯一目标',
    icon: 'grid_view',
    category: '知觉与注意',
    tags: ['注意力', '目标搜索', '视觉'],
  },
  {
    slug: 'time-perception',
    title: '时间感知',
    desc: '不看钟，凭感觉估出目标时长后停止',
    icon: 'schedule',
    category: '知觉与注意',
    tags: ['时间感知', '内部时钟', '估计'],
  },
  {
    slug: 'color-vision',
    title: '色觉辨别',
    desc: '色块中藏了一个异色块，逐级变难',
    icon: 'contrast',
    category: '知觉与注意',
    tags: ['色觉', '颜色', '辨别'],
  },

  // ── 执行功能 + 流体推理（Gf） ──
  {
    slug: 'stroop',
    title: 'Stroop 干扰',
    desc: '按字的颜色选择，无视字义干扰',
    icon: 'palette',
    category: '执行与推理',
    tags: ['干扰抑制', '注意力', '颜色'],
  },
  {
    slug: 'task-switching',
    title: '任务切换',
    desc: '规则随机切换：按奇偶或按元音分类，测切换成本',
    icon: 'alt_route',
    category: '执行与推理',
    tags: ['认知灵活性', '切换', '执行'],
  },
  {
    slug: 'number-series',
    title: '逻辑推理',
    desc: '找出数列规律，选出下一个数',
    icon: 'quiz',
    category: '执行与推理',
    tags: ['逻辑', '推理', '数列'],
  },
  {
    slug: 'mental-math',
    title: '心算速度',
    desc: '连续加减乘，看你的数学流畅性',
    icon: 'calculate',
    category: '执行与推理',
    tags: ['心算', '数学', '计算'],
  },

  // ── 决策倾向 + 冲动控制 ──
  {
    slug: 'risk-preference',
    title: '风险偏好',
    desc: '确定的小奖还是五五开的大奖？六道选择题',
    icon: 'casino',
    category: '决策与自控',
    tags: ['风险', '决策', '偏好'],
  },
  {
    slug: 'delay-gratification',
    title: '延迟满足',
    desc: '立即拿小积分，还是等待换大积分？',
    icon: 'hourglass',
    category: '决策与自控',
    tags: ['延迟满足', '自制力', '等待'],
  },
];

export const tests = published(allTests); // 生产构建滤除 draft 条目（决策 #18）
