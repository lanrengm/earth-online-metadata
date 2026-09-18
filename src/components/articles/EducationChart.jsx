import { useMemo, useState } from 'react';
import Chart, { useThemeName, cssVar } from './Chart.jsx';
import { censusAgeGroups, censusLevels } from '../../data/census2020.js';

/** 学历为有序变量 → 顺序色阶（surfaceMuted → brand 十段插值），主题感知 */
function ramp(steps) {
  const parse = (h) => {
    const s = h.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const mix = (a, b, t) =>
    '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const from = parse(cssVar('--surface-container-high') || '#e6e6e6');
  const to = parse(cssVar('--primary') || '#00897b');
  return Array.from({ length: steps }, (_, i) => mix(from, to, i / (steps - 1)));
}

function Pill({ label, options, value, onChange }) {
  return (
    <div className="eq-row">
      <span className="eq-label">{label}</span>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={`eq-pill${i === value ? ' on' : ''}`}
          onClick={() => onChange(i)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * 学历排位交互图（七普数据）：全景 100% 堆叠柱 + 「你在这里」定位针 + 同学历幽灵线。
 * 纯前端计算，无数据上传。
 */
export default function EducationChart() {
  const [ageIdx, setAgeIdx] = useState(2);
  const [lvIdx, setLvIdx] = useState(5);
  const theme = useThemeName();

  const option = useMemo(() => {
    const muted = cssVar('--on-surface-variant') || '#444746';
    const border = cssVar('--outline-variant') || '#c4c7c5';
    const primary = cssVar('--primary') || '#00897b';
    const onPrimary = cssVar('--on-primary') || '#ffffff';
    const colors = ramp(censusLevels.length);

    const belowOf = (ai) =>
      censusAgeGroups[ai].shares.slice(0, lvIdx).reduce((a, b) => a + b, 0);

    const series = censusLevels.map((lv, li) => ({
      name: lv,
      type: 'bar',
      stack: 'edu',
      barWidth: '58%',
      data: censusAgeGroups.map((g, ai) => ({
        value: g.shares[li],
        itemStyle: {
          opacity: ai === ageIdx ? 1 : 0.4,
          borderColor: ai === ageIdx && li === lvIdx ? primary : 'transparent',
          borderWidth: ai === ageIdx && li === lvIdx ? 2 : 0,
        },
      })),
      color: colors[li],
    }));

    // 「你在这里」：细横线 + 标签（定位在所选列的学历下边界）
    series.push({
      name: 'pin-line',
      type: 'scatter',
      data: [{ value: [ageIdx, belowOf(ageIdx)], symbol: 'rect', symbolSize: [92, 2] }],
      itemStyle: { color: primary },
      silent: true,
      z: 10,
    });
    series.push({
      name: 'pin-tag',
      type: 'scatter',
      data: [
        {
          value: [ageIdx, belowOf(ageIdx)],
          symbolSize: 0,
          label: {
            show: true,
            formatter: `你在这里 · 超过 ${Math.round(belowOf(ageIdx))}%`,
            position: 'top',
            distance: 8,
            backgroundColor: primary,
            color: onPrimary,
            fontSize: 12,
            padding: [4, 10],
            borderRadius: 999,
          },
        },
      ],
      itemStyle: { color: primary },
      silent: true,
      z: 11,
    });
    // 幽灵线：同一学历在其它年龄组的位置
    series.push({
      name: 'ghost',
      type: 'scatter',
      data: censusAgeGroups.map((g, ai) =>
        ai === ageIdx
          ? null
          : { value: [ai, belowOf(ai)], symbol: 'rect', symbolSize: [72, 1.5] },
      ).filter(Boolean),
      itemStyle: { color: muted, opacity: 0.6 },
      silent: true,
      z: 5,
    });

    return {
      animationDuration: 150,
      grid: { left: 56, right: 16, top: 24, bottom: 44 },
      xAxis: {
        type: 'category',
        data: censusAgeGroups.map((g) => g.label),
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: border } },
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => `${v}%`,
        textStyle: { fontSize: 12 },
      },
      series,
    };
  }, [ageIdx, lvIdx, theme]);

  const below = censusAgeGroups[ageIdx].shares.slice(0, lvIdx).reduce((a, b) => a + b, 0);
  const atOrAbove = 100 - below;

  return (
    <div className="eq">
      <style>{`
        .eq { display: flex; flex-direction: column; gap: 12px; margin: 8px 0 4px; }
        .eq-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .eq-label { font-size: 13px; color: var(--on-surface-variant); min-width: 56px; }
        .eq-pill {
          border: 1px solid var(--outline-variant); background: var(--surface-container-low);
          color: var(--on-surface); border-radius: 999px; padding: 4px 14px;
          font-size: 13px; font-family: var(--font-body); cursor: pointer;
          transition: border-color .12s ease, background-color .12s ease, color .12s ease;
        }
        .eq-pill:hover { border-color: var(--primary); }
        .eq-pill.on { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }
        .eq-readout { font-size: 14px; color: var(--on-surface-variant); line-height: 1.7; margin: 0; }
        .eq-readout strong { color: var(--primary); }
      `}</style>
      <Pill label="年龄段" options={censusAgeGroups.map((g) => g.label)} value={ageIdx} onChange={setAgeIdx} />
      <Pill label="你的学历" options={censusLevels} value={lvIdx} onChange={setLvIdx} />
      <Chart option={option} height={380} ariaLabel="分年龄段学历分布堆叠图，含你的排位定位" />
      <p className="eq-readout">
        在 <strong>{censusAgeGroups[ageIdx].label}</strong> 这一代人中，你的学历高于约{' '}
        <strong>{Math.round(below)}%</strong> 的同龄人；达到{censusLevels[lvIdx]}及以上的占{' '}
        {Math.round(atOrAbove)}%。灰色细线是同一学历线在其它年龄组的位置——从右往左看，
        这就是「学历通胀」本身。
      </p>
    </div>
  );
}
