/**
 * 人生主线任务树数据（首个工具：/tools/life-quest/）
 *
 * 结构：3 系（分支）→ 领域 → 任务卡（含行动描述）。
 * 任务 id 必须稳定：localStorage 勾选状态以 id 为键，改动即丢档。
 * 配色对应 tokens.css 的 --branch-* 令牌（健康=primary、财富=--branch-wealth、情感=--branch-emotion）。
 */
export const questBranches = [
  {
    id: 'health',
    name: '健康系',
    icon: 'favorite',
    token: 'primary',
    domains: [
      {
        name: '身体',
        tasks: [
          { id: 'health-regular-sleep', title: '规律作息', desc: '养成早睡早起习惯，保证充足睡眠' },
          { id: 'health-exercise', title: '运动', desc: '每周进行 3~4 次有氧运动，如慢跑' },
          { id: 'health-diet', title: '健康饮食', desc: '多吃蔬果，均衡营养，拒绝加工食品' },
        ],
      },
      {
        name: '精神',
        tasks: [
          { id: 'health-cognition', title: '认知', desc: '持续学习跨领域知识，建立自己的思维模型' },
          { id: 'health-mind', title: '心理', desc: '练习冥想技巧，定期清理思绪' },
        ],
      },
    ],
  },
  {
    id: 'wealth',
    name: '财富系',
    icon: 'payments',
    token: 'wealth',
    domains: [
      {
        name: '工作',
        tasks: [
          { id: 'wealth-skill', title: '专业技能', desc: '持续打磨专业技能，紧跟行业前沿' },
          { id: 'wealth-intensity', title: '工作强度', desc: '合理安排工作节奏，避免过度劳累' },
        ],
      },
      {
        name: '事业',
        tasks: [
          { id: 'wealth-interest', title: '兴趣', desc: '找到自己的热爱，并长期投入' },
          { id: 'wealth-execution', title: '可执行', desc: '制定清晰可行的计划，稳步推进' },
        ],
      },
      {
        name: '理财',
        tasks: [
          { id: 'wealth-expense', title: '减少开支', desc: '学习基础理财知识，做好收支规划' },
          { id: 'wealth-manage', title: '财务管理', desc: '坚持记账与定期复盘，让每笔钱可追溯' },
        ],
      },
    ],
  },
  {
    id: 'emotion',
    name: '情感系',
    icon: 'diversity_1',
    token: 'emotion',
    domains: [
      {
        name: '友情',
        tasks: [
          { id: 'emotion-gathering', title: '定期聚会', desc: '有价值的交流，拒绝无效社交' },
        ],
      },
      {
        name: '亲情',
        tasks: [
          { id: 'emotion-family', title: '尊老爱幼', desc: '常回家陪伴，共享温馨时光' },
          { id: 'emotion-friction', title: '减少内耗', desc: '不与家人斤斤计较，避免无意义争吵' },
        ],
      },
      {
        name: '爱情',
        tasks: [
          { id: 'emotion-communication', title: '加强交流', desc: '与伴侣定期沟通，分享梦想与烦恼' },
          { id: 'emotion-support', title: '相互支持', desc: '设定共同目标，相互赋能' },
        ],
      },
    ],
  },
];

/** 全部任务扁平列表（进度计算用） */
export const questTasks = questBranches.flatMap((b) =>
  b.domains.flatMap((d) => d.tasks.map((t) => ({ ...t, branchId: b.id, domain: d.name }))),
);

export const questTotals = {
  total: questTasks.length,
  byBranch: Object.fromEntries(
    questBranches.map((b) => [
      b.id,
      b.domains.reduce((n, d) => n + d.tasks.length, 0),
    ]),
  ),
};
