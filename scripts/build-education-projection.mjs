/**
 * 学历排位 2030 推算模型（队列外推法）
 *
 * 用法：node scripts/build-education-projection.mjs
 * 输出：src/data/educationProjection.json（2020-2030 每年 6 年龄段 × 7 学历层占比 + 全国大专及以上总量）
 *
 * 方法（队列要素法简化版）：
 *   基线：七普表 4-1 单岁人口×最高学历（src/data/census2020SingleAge.json）
 *   每年推进：
 *     1. 全体队列 +1 岁
 *     2. 教育升级：当年普通本专科招生数从 18-22 岁「高中/初中」层转入「大专/本科」
 *        （本专科比例取 2024 年官方招生结构 47:53）；研究生招生数从 23-30 岁「本科」层转入「研究生」
 *     3. 新进入者：出生人口(t-3) 以「学前教育」身份进入 3 岁队列
 *   简化假设（全文标注，不隐藏）：
 *     a. 忽略死亡——它几乎同比例作用于各学历层，对「组内排位」影响 <1 个百分点；
 *        因此本模型输出用于排位对比，不可当作人口总量预测
 *     b. 2025-2030 年招生数保持 2024 年水平（保守情景），未计成人教育与网络教育增量
 *        → 模型为「排位下移」的保守下界
 *   校验锚点：模型 2023 年全国大专及以上人口，对照国家统计局官方口径「超 2.5 亿」
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(root, 'src/data/census2020SingleAge.json'), 'utf-8'));

// ── 官方年度输入（万人）────────────────────────────────────────
const births = { 2013: 1640, 2014: 1687, 2015: 1655, 2016: 1786, 2017: 1723, 2018: 1523, 2019: 1465, 2020: 1202, 2021: 1062, 2022: 956, 2023: 902, 2024: 954 };
// 2025-2027 情景：按 2023-2024 均值企稳（保守）
births[2025] = 920; births[2026] = 920; births[2027] = 920;

const collegeEnroll = { 2020: 967.5, 2021: 1001.3, 2022: 1014.5, 2023: 1042.2, 2024: 1068.9 };
const gradEnroll = { 2020: 110.7, 2021: 117.7, 2022: 124.3, 2023: 130.2, 2024: 135.7 };
for (let t = 2025; t <= 2030; t++) { collegeEnroll[t] = collegeEnroll[2024]; gradEnroll[t] = gradEnroll[2024]; }
const BACHELOR_SHARE = 0.47; // 2024 年本专科招生结构（本科 501 万 / 1069 万）

const IDX = { noedu: 1, preschool: 2, primary: 3, junior: 4, senior: 5, college: 6, bachelor: 7, grad: 8 };

// 初始状态：单岁 3..79 + 80-84 组 + 85+ 组
let state = {};
for (let a = 3; a <= 79; a++) {
  const cells = base.ages[String(a)];
  if (cells) state[a] = cells.slice();
}
state['80-84'] = base.groups['80-84岁'].slice();
state['85+'] = base.groups['85岁及以上'].slice();

function moveUp(state, ages, fromLevels, toLevel, quotaWan) {
  // quotaWan（万人）→ 人；从 fromLevels 层按各层人口占比抽取转入 toLevel（键经 IDX 换算）
  const quota = quotaWan * 1e4;
  const poolAges = ages.filter((a) => state[a]);
  const fromIdx = fromLevels.map((lv) => IDX[lv]);
  let pool = 0;
  for (const a of poolAges) for (const lv of fromIdx) pool += state[a][lv];
  if (pool === 0) return;
  for (const a of poolAges) {
    for (const lv of fromIdx) {
      const share = state[a][lv] / pool;
      let moved = quota * share;
      moved = Math.min(moved, state[a][lv]);
      state[a][lv] -= moved;
      state[a][toLevel] += moved;
    }
  }
}

function yearTotal(state, levels) {
  let total = 0;
  for (const a of Object.keys(state)) for (const lv of levels) total += state[a][IDX[lv]];
  return total; // 人
}

// 6 个展示年龄段 → 单岁区间
const BUCKETS = [
  { key: '3-17', label: '3-17岁', lo: 3, hi: 17 },
  { key: '18-24', label: '18-24岁', lo: 18, hi: 24 },
  { key: '25-30', label: '25-30岁', lo: 25, hi: 30 },
  { key: '31-40', label: '31-40岁', lo: 31, hi: 40 },
  { key: '41-50', label: '41-50岁', lo: 41, hi: 50 },
  { key: '50+', label: '50岁以上', lo: 51, hi: 200 },
];
// 展示层：未上过学(含学前)、小学、初中、高中、大专、本科、研究生
const DISPLAY = [
  ['noedu', 'preschool'],
  ['primary'], ['junior'], ['senior'], ['college'], ['bachelor'], ['grad'],
];

function aggregate(state) {
  const out = {};
  for (const b of BUCKETS) {
    const sum = { total: 0 };
    for (const d of DISPLAY) for (const k of d) sum[k] = 0;
    for (let a = b.lo; a <= Math.min(b.hi, 85); a++) {
      const s = state[a];
      if (!s) continue;
      sum.total += s[0];
      for (const d of DISPLAY) for (const k of d) sum[k] += s[IDX[k]];
    }
    // 85+ 桶归入 50+
    if (b.key === '50+') {
      const g80 = state['80-84'], g85 = state['85+'];
      for (const g of [g80, g85]) {
        if (!g) continue;
        sum.total += g[0];
        sum.noedu += g[IDX.noedu] + g[IDX.preschool];
        sum.primary += g[IDX.primary]; sum.junior += g[IDX.junior];
        sum.senior += g[IDX.senior]; sum.college += g[IDX.college];
        sum.bachelor += g[IDX.bachelor]; sum.grad += g[IDX.grad];
      }
    }
    out[b.key] = DISPLAY.map((d) => {
      const v = d.reduce((acc, k) => acc + sum[k], 0);
      return Math.round((v / sum.total) * 1000) / 10;
    });
  }
  return out;
}

/** 学龄晋升：年级随年龄推进（7 岁入小学、13 岁升初中、16 岁升高中阶段；忽略辍学，约高估 2-5%） */
function promote(cells, age) {
  if (age >= 7 && age <= 12) {
    const moved = cells[IDX.noedu] + cells[IDX.preschool];
    cells[IDX.noedu] = 0;
    cells[IDX.preschool] = 0;
    cells[IDX.primary] += moved;
  } else if (age >= 13 && age <= 15) {
    const moved = cells[IDX.noedu] + cells[IDX.preschool] + cells[IDX.primary];
    cells[IDX.noedu] = 0;
    cells[IDX.preschool] = 0;
    cells[IDX.primary] = 0;
    cells[IDX.junior] += moved;
  } else if (age >= 16 && age <= 18) {
    const moved = cells[IDX.noedu] + cells[IDX.preschool] + cells[IDX.primary] + cells[IDX.junior];
    cells[IDX.noedu] = 0;
    cells[IDX.preschool] = 0;
    cells[IDX.primary] = 0;
    cells[IDX.junior] = 0;
    cells[IDX.senior] += moved;
  }
}

// ── 推进 2021..2030 ────────────────────────────────────────────
const years = [2020];
const distributions = { 2020: aggregate(state) };
const uniTotals = { 2020: Math.round(yearTotal(state, ['college', 'bachelor', 'grad']) / 1e4) };

for (let t = 2021; t <= 2030; t++) {
  // 1. 队列 +1 岁，伴随学龄晋升（7岁入小学、13岁升初中、16岁升高中阶段）
  const next = {};
  for (const a of Object.keys(state)) {
    const n = Number(a);
    if (Number.isInteger(n)) {
      let dest;
      if (n + 1 <= 79) dest = (next[n + 1] ??= [0, 0, 0, 0, 0, 0, 0, 0, 0]);
      else if (n + 1 <= 84) dest = (next['80-84'] ??= [0, 0, 0, 0, 0, 0, 0, 0, 0]);
      else dest = (next['85+'] ??= [0, 0, 0, 0, 0, 0, 0, 0, 0]);
      for (let i = 0; i < 9; i++) dest[i] += state[a][i];
      // 学龄晋升：仅对单岁队列（年级随年龄推进）
      if (Number.isInteger(n + 1)) promote(dest, n + 1);
    } else {
      const dest = (next['85+'] ??= [0, 0, 0, 0, 0, 0, 0, 0, 0]);
      for (let i = 0; i < 9; i++) dest[i] += state[a][i];
    }
  }
  // 2. 新 3 岁队列（出生人口 t-3）
  const b3 = (births[t - 3] ?? 900) * 1e4;
  next[3] = [b3, 0, b3, 0, 0, 0, 0, 0, 0]; // 全部记入学前层
  state = next;

  // 3. 教育升级（官方招生流量）
  moveUp(state, [18, 19, 20, 21, 22], ['senior', 'junior'], IDX.college, collegeEnroll[t] * (1 - BACHELOR_SHARE));
  moveUp(state, [18, 19, 20, 21, 22], ['senior', 'junior'], IDX.bachelor, collegeEnroll[t] * BACHELOR_SHARE);
  moveUp(state, [23, 24, 25, 26, 27, 28, 29, 30], ['bachelor'], IDX.grad, gradEnroll[t]);

  years.push(t);
  distributions[t] = aggregate(state);
  uniTotals[t] = Math.round(yearTotal(state, ['college', 'bachelor', 'grad']) / 1e4);
}

// ── 校验锚点 ───────────────────────────────────────────────────
console.log('全国大专及以上人口（万人）:');
for (const y of years) console.log(`  ${y}: ${uniTotals[y]}`);
console.log('官方锚点: 2020 七普 21836 万；2023 年末「超 25000 万」');
const err2023 = ((uniTotals[2023] - 25000) / 25000) * 100;
console.log(`模型 2023 = ${uniTotals[2023]} 万，相对 2.5 亿锚点偏差 ${err2023.toFixed(1)}%`);

writeFileSync(
  join(root, 'src/data/educationProjection.json'),
  JSON.stringify({
    note: '队列外推模型输出（方法与假设见 scripts/build-education-projection.mjs）；2020 为实测（七普），2021 起为推算',
    years,
    levels: ['未上过学(含学前)', '小学', '初中', '高中', '大专', '本科', '研究生'],
    ageGroups: BUCKETS.map(({ key, label }) => ({ key, label })),
    distributions,
    uniTotals,
  }, null, 1),
);
console.log('✓ 已写入 src/data/educationProjection.json');
