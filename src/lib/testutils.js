/**
 * 属性检定共享工具：参考分布百分位 + 本机历史（localStorage）。
 * 数据红线：所有参考分布必须在结果卡标注来源与「非临床常模」局限（决策 #16）。
 */

/** 标准正态 CDF（Abramowitz–Stegun erf 近似，误差 <1.5e-7） */
export function normalCdf(x, mean, sd) {
  const z = (x - mean) / (sd * Math.SQRT2);
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const erf =
    Math.sign(z) *
    (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z));
  return (1 + erf) / 2;
}

/** lowerBetter（反应时类）：百分位 = 小于你的比例；higherBetter（广度类）：百分位 = 小于你的比例 */
export function percentile(score, { mean, sd, higherBetter = false }) {
  const cdf = normalCdf(score, mean, sd);
  return Math.round((higherBetter ? cdf : 1 - cdf) * 100);
}

/** 数字广度（正向）分档百分位——基于经典 7±2 与 WAIS 正向广度的粗略分档，非临床常模 */
export const DIGIT_SPAN_PERCENTILE = { 2: 2, 3: 8, 4: 22, 5: 40, 6: 58, 7: 74, 8: 88, 9: 95, 10: 98, 11: 99 };
export function digitSpanPercentile(span) {
  const keys = Object.keys(DIGIT_SPAN_PERCENTILE).map(Number).sort((a, b) => a - b);
  const capped = Math.min(span, keys[keys.length - 1]);
  return DIGIT_SPAN_PERCENTILE[capped] ?? 50;
}

export function percentileLabel(p) {
  return `第 ${p} 百分位`;
}

const KEY_PREFIX = 'eo_tests_';

/** 读取某测试的本机历史（最近在后的升序数组） */
export function loadHistory(slug) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_PREFIX + slug) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** 追加一条成绩，保留最近 20 条，返回新数组 */
export function appendHistory(slug, entry) {
  const next = [...loadHistory(slug), { date: new Date().toISOString().slice(0, 10), ...entry }].slice(-20);
  localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(next));
  return next;
}

/** 中位数（偶数长度取均值） */
export function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
