import { useMemo } from 'react';
import Chart, { useThemeName, cssVar } from './Chart.jsx';
import { grossEnrollmentRate } from '../../data/eduTrends.js';

/** 高等教育毛入学率趋势（2012-2024，教育部公报），2020 普查时点高亮 */
export default function EducationTrend() {
  const theme = useThemeName();

  const option = useMemo(() => {
    const muted = cssVar('--on-surface-variant') || '#444746';
    const border = cssVar('--outline-variant') || '#c4c7c5';
    const primary = cssVar('--primary') || '#00897b';
    const years = grossEnrollmentRate.map((d) => d.year);
    const rates = grossEnrollmentRate.map((d) => d.rate);
    const censusIdx = years.indexOf(2020);

    return {
      animationDuration: 150,
      grid: { left: 48, right: 20, top: 28, bottom: 40 },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 80,
        axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: border } },
      },
      tooltip: { trigger: 'axis', valueFormatter: (v) => `${v}%` },
      series: [
        {
          name: '高等教育毛入学率',
          type: 'line',
          data: rates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: primary, width: 3 },
          itemStyle: { color: primary },
          label: {
            show: true,
            position: 'top',
            formatter: (p) => (p.dataIndex === censusIdx || p.dataIndex === rates.length - 1 ? `${p.value}%` : ''),
            color: muted,
            fontSize: 12,
            fontWeight: 600,
          },
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(0, 137, 123, 0.08)' },
            label: {
              show: true,
              position: 'insideTop',
              color: muted,
              fontSize: 12,
              formatter: '七普快照 → 此后继续扩张',
            },
            data: [[{ xAxis: 2020 }, { xAxis: 2024 }]],
          },
        },
      ],
    };
    // theme 仅用于主题切换时重算 CSS 变量色值，非 ECharts 数据依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div className="et">
      <Chart option={option} height={320} ariaLabel="高等教育毛入学率 2012 至 2024 年趋势折线图" />
    </div>
  );
}
