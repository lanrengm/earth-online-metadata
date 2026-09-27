import { useEffect, useState } from 'react';
import Chart, { cssVar } from '../articles/Chart.jsx';
import { loadHistory, percentileLabel } from '../../lib/testutils.js';

/**
 * 能力画像雷达（能力指纹）：聚合各测试最近一次的参考分布百分位（0-100）。
 * 仅纳入有参考分布的 6 项；实验性指标（无百分位）单独列出最近成绩。
 * 实验性成绩数据全部来自本机 localStorage（eo_tests_<slug>）。
 */

const RADAR_TESTS = [
  { slug: 'reaction-time', name: '视觉反应' },
  { slug: 'choice-reaction', name: '选择反应' },
  { slug: 'auditory-reaction', name: '听觉反应' },
  { slug: 'digit-span', name: '数字广度' },
  { slug: 'stroop', name: 'Stroop 干扰' },
  { slug: 'mental-rotation', name: '心理旋转' },
];

const EXPERIMENTAL = [
  { slug: 'visual-search', name: '视觉搜索', unit: 's', scale: 0.001 },
  { slug: 'time-perception', name: '时间感知', unit: '%', scale: 1 },
  { slug: 'n-back', name: 'N-back 记忆', unit: '%', scale: 1 },
];

function collect() {
  const tested = RADAR_TESTS.map((t) => {
    const h = loadHistory(t.slug);
    const last = h[h.length - 1];
    return { ...t, last };
  });
  const experimental = EXPERIMENTAL.map((t) => {
    const h = loadHistory(t.slug);
    const last = h[h.length - 1];
    return { ...t, last };
  });
  return { tested, experimental, done: tested.filter((t) => t.last).length };
}

export default function AbilityRadar() {
  const [data, setData] = useState(null);

  // 挂载后从 localStorage 聚合本机成绩（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setData(collect()), []);

  const theme = cssVar('--primary') || '#00897b';
  const border = cssVar('--outline-variant') || '#c4c7c5';
  const muted = cssVar('--on-surface-variant') || '#444746';

  const option = data && data.done > 0 ? {
    animationDuration: 300,
    radar: {
      indicator: data.tested.map((t) => ({ name: t.name, max: 100 })),
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisName: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: border } },
      axisLine: { lineStyle: { color: border } },
    },
    series: [{
      type: 'radar',
      symbolSize: 5,
      data: [{
        value: data.tested.map((t) => (t.last ? t.last.percentile : 0)),
        name: '参考百分位',
        areaStyle: { color: theme, opacity: 0.18 },
        lineStyle: { color: theme, width: 2 },
        itemStyle: { color: theme },
        label: {
          show: true,
          color: muted,
          fontSize: 11,
          formatter: (p) => (p.value > 0 ? p.value : ''),
        },
      }],
    }],
  } : null;

  if (!data) return <div className="ab-loading">读取本机成绩…</div>;

  if (data.done === 0) {
    return (
      <div className="ab-empty">
        <p>还没有成绩。完成任意一项带百分位的检定后，这里会生成你的能力画像雷达。</p>
        <p className="ab-norm">百分位来自站内参考分布（非临床常模），成绩仅保存在本机。</p>
      </div>
    );
  }

  return (
    <div className="ab">
      <Chart option={option} height={320} ariaLabel="能力画像雷达图：各测试最近成绩的参考百分位" />
      <ul className="ab-detail">
        {data.tested.map((t) => (
          <li key={t.slug}>
            <span>{t.name}</span>
            <strong>{t.last ? percentileLabel(t.last.percentile) : '未测'}</strong>
            <span className="ab-date">{t.last ? t.last.date : '—'}</span>
          </li>
        ))}
      </ul>
      <p className="ab-norm">雷达各轴 = 最近一次成绩的参考分布百分位（0-100），未测轴为 0。参考分布为站内标注的文献量级/网络样本近似，非临床常模；成绩仅保存在本机。</p>

      {data.experimental.some((t) => t.last) && (
        <>
          <p className="ab-sub">实验性指标（无参考分布，仅本机对照）</p>
          <ul className="ab-detail">
            {data.experimental.filter((t) => t.last).map((t) => (
              <li key={t.slug}>
                <span>{t.name}</span>
                <strong>{(t.last.score * t.scale).toFixed(t.scale === 0.001 ? 2 : 0)}{t.unit}</strong>
                <span className="ab-date">{t.last.date}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
