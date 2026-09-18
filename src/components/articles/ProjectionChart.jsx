import { useMemo, useState } from 'react';
import Chart, { useThemeName, cssVar } from './Chart.jsx';
import educationProjection from '../../data/educationProjection.json';

const LEVELS = educationProjection.levels;
const AGE_GROUPS = educationProjection.ageGroups;

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

function belowOf(yearIdx, ageIdx, lvIdx) {
  const year = educationProjection.years[yearIdx];
  const key = AGE_GROUPS[ageIdx].key;
  return educationProjection.distributions[year][key]
    .slice(0, lvIdx)
    .reduce((a, b) => a + b, 0);
}

/** 排位年份滑块（2020 实测 → 2030 推算） */
export default function ProjectionChart() {
  const [yearIdx, setYearIdx] = useState(6); // 默认 2026
  const [ageIdx, setAgeIdx] = useState(2);
  const [lvIdx, setLvIdx] = useState(5);
  const theme = useThemeName();

  const option = useMemo(() => {
    const muted = cssVar('--on-surface-variant') || '#444746';
    const border = cssVar('--outline-variant') || '#c4c7c5';
    const primary = cssVar('--primary') || '#00897b';
    const onPrimary = cssVar('--on-primary') || '#ffffff';
    const colors = ramp(LEVELS.length);
    const year = educationProjection.years[yearIdx];
    const shares = AGE_GROUPS.map((g) => educationProjection.distributions[year][g.key]);

    const series = LEVELS.map((lv, li) => ({
      name: lv,
      type: 'bar',
      stack: 'edu',
      barWidth: '58%',
      data: AGE_GROUPS.map((_, ai) => ({
        value: shares[ai][li],
        itemStyle: {
          opacity: ai === ageIdx ? 1 : 0.4,
          borderColor: ai === ageIdx && li === lvIdx ? primary : 'transparent',
          borderWidth: ai === ageIdx && li === lvIdx ? 2 : 0,
        },
      })),
      color: colors[li],
    }));
    series.push({
      name: 'pin-line',
      type: 'scatter',
      data: [{ value: [ageIdx, belowOf(yearIdx, ageIdx, lvIdx)], symbol: 'rect', symbolSize: [92, 2] }],
      itemStyle: { color: primary },
      silent: true,
      z: 10,
    });
    series.push({
      name: 'pin-tag',
      type: 'scatter',
      data: [
        {
          value: [ageIdx, belowOf(yearIdx, ageIdx, lvIdx)],
          symbolSize: 0,
          label: {
            show: true,
            formatter: `${year} · 超过 ${Math.round(belowOf(yearIdx, ageIdx, lvIdx))}%`,
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

    return {
      animationDuration: 200,
      grid: { left: 56, right: 16, top: 30, bottom: 44 },
      xAxis: {
        type: 'category',
        data: AGE_GROUPS.map((g) => g.label),
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
      tooltip: { trigger: 'axis', valueFormatter: (v) => `${v}%`, textStyle: { fontSize: 12 } },
      series,
    };
    // theme 仅用于主题切换时重算 CSS 变量色值，非 ECharts 数据依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearIdx, ageIdx, lvIdx, theme]);

  const year = educationProjection.years[yearIdx];
  const isProjected = year > 2020;
  const below = belowOf(yearIdx, ageIdx, lvIdx);
  const below2020 = belowOf(0, ageIdx, lvIdx);

  return (
    <div className="eq">
      <style>{`
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
        .eq-slider { display: flex; align-items: center; gap: 12px; }
        .eq-year { font: 700 20px/28px var(--font-title); color: var(--primary); min-width: 64px; font-variant-numeric: tabular-nums; }
        .eq-year-badge {
          font-size: 12px; padding: 2px 10px; border-radius: 999px;
          background: var(--primary-container); color: var(--on-primary-container);
        }
        .eq-readout { font-size: 14px; color: var(--on-surface-variant); line-height: 1.7; margin: 0; }
        .eq-readout strong { color: var(--primary); }
        input[type='range'].eq-range { flex: 1; accent-color: var(--primary); }
      `}</style>

      <div className="eq-slider">
        <span className="eq-year">{year}</span>
        <input
          className="eq-range"
          type="range"
          min="0"
          max={educationProjection.years.length - 1}
          step="1"
          value={yearIdx}
          onChange={(e) => setYearIdx(Number(e.target.value))}
          aria-label="选择推算年份"
        />
        <span className="eq-year-badge">{isProjected ? '推算' : '实测·七普'}</span>
      </div>
      <div className="eq-row">
        <span className="eq-label">年龄段</span>
        {AGE_GROUPS.map((g, i) => (
          <button key={g.key} type="button" className={`eq-pill${i === ageIdx ? ' on' : ''}`} onClick={() => setAgeIdx(i)}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="eq-row">
        <span className="eq-label">你的学历</span>
        {LEVELS.map((l, i) => (
          <button key={l} type="button" className={`eq-pill${i === lvIdx ? ' on' : ''}`} onClick={() => setLvIdx(i)}>
            {l}
          </button>
        ))}
      </div>
      <Chart option={option} height={380} ariaLabel="各年份分年龄段学历分布推算堆叠图，含你的排位定位" />
      <p className="eq-readout">
        {isProjected
          ? '按队列外推模型，'
          : '七普实测：'}
        <strong>{year}</strong> 年，<strong>{AGE_GROUPS[ageIdx].label}</strong> 组中你的学历高于约{' '}
        <strong>{Math.round(below)}%</strong> 的同龄人
        {isProjected && below < below2020 - 0.05 && (
          <>
            {' '}（2020 年实测为 {Math.round(below2020)}%，六年下滑 <strong>{Math.round(below2020 - below)}</strong> 个百分点）
          </>
        )}。
      </p>
    </div>
  );
}
