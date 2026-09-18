import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, ScatterChart, GridComponent, TooltipComponent, CanvasRenderer]);

/** 观察站点主题（html[data-theme]），返回 'light' | 'dark'，切换时触发重渲染（SSR 环境返回 'light'） */
export function useThemeName() {
  const read = () =>
    typeof document === 'undefined'
      ? 'light'
      : document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'light';
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const ob = new MutationObserver(() => setTheme(read()));
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => ob.disconnect();
  }, []);
  return theme;
}

/** 读取 tokens.css 令牌的实际色值（主题感知；SSR 环境返回空串，调用方需给 fallback） */
export function cssVar(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * ECharts 通用封装岛屿（全站唯一入口，约定见 docs/架构决策.md）。
 * 按 echarts/core 按需注册以控制体积；跟随主题重渲染；容器尺寸自适应。
 */
export default function Chart({ option, height = 420, ariaLabel }) {
  const elRef = useRef(null);
  const chartRef = useRef(null);
  const theme = useThemeName();

  useEffect(() => {
    if (!elRef.current) return;
    chartRef.current = echarts.init(elRef.current);
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(elRef.current);
    return () => {
      ro.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option, theme]);

  return <div ref={elRef} style={{ height }} role="img" aria-label={ariaLabel} />;
}
