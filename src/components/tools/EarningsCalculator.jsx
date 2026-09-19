import { useEffect, useState } from 'react';

/**
 * 生涯收入计算器（MVP 静态口径）：
 * 总收入 = 月薪 × 12 × (退休年龄 − 当前年龄)。不含税、社保、涨幅与通胀折现（决策 #15）。
 * 输入持久化 localStorage（'eo_career_earnings'），重置需确认。
 */

const KEY = 'eo_career_earnings';
const DEFAULTS = { age: 25, salary: 10000, retire: 63 };
const fmt = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

function loadInitial() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export default function EarningsCalculator() {
  const [state, setState] = useState(loadInitial);
  const { age, salary, retire } = state;

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const years = Math.max(0, Math.floor(retire - age));
  const total = Math.round((Number(salary) || 0) * 12 * years);
  const perYear = Math.round((Number(salary) || 0) * 12);

  const num = (v) => String(Math.max(0, Math.floor(Number(v) || 0)));
  const field = (label, value, setter, hint) => (
    <label className="ce-field">
      <span className="ce-label">{label}</span>
      <input
        className="ce-input"
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => setter(num(e.target.value))}
      />
      {hint && <span className="ce-hint">{hint}</span>}
    </label>
  );

  return (
    <div className="ce">
      <div className="ce-form">
        {field('当前年龄', age, (v) => setState((s) => ({ ...s, age: v })))}
        {field('月薪（元）', salary, (v) => setState((s) => ({ ...s, salary: v })), '税前或到手均可，按你填的口径计')}
        {field('退休年龄', retire, (v) => setState((s) => ({ ...s, retire: v })), '参考：男 63 / 女 55')}
      </div>

      <div className="ce-result">
        <p className="ce-result-label">到退休还能进账</p>
        {years > 0 ? (
          <>
            <p className="ce-total">{fmt.format(total)}<span className="ce-unit">元</span></p>
            <p className="ce-breakdown">
              还要打 <strong>{years}</strong> 年工：每年 {fmt.format(perYear)} 元 × {years} 年
            </p>
          </>
        ) : (
          <p className="ce-breakdown">当前年龄已不低于退休年龄，本局已通关——没有剩余工资结算了。</p>
        )}
      </div>

      <button
        type="button"
        className="ce-reset"
        onClick={() => {
          if (window.confirm('恢复默认值？')) setState({ ...DEFAULTS });
        }}
      >
        恢复默认
      </button>
    </div>
  );
}
