import { useEffect, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory } from '../../lib/testutils.js';

/**
 * 风险偏好（阶梯法）：6 道二选一——「确定拿 50 元」vs「50% 概率拿 X 元」，
 * X 从 100 递增到 500（期望值从持平到远超确定项）。
 * 指标 = 冒险选择次数（0-6）与首次冒险的位置。无对错之分，纯偏好画像。
 * 实验性指标：无参考分布（决策 #16）。
 */
const LADDER = [
  { sure: 50, gamble: 100 },  // EV=50  持平
  { sure: 50, gamble: 120 },  // EV=60
  { sure: 50, gamble: 150 },  // EV=75
  { sure: 50, gamble: 200 },  // EV=100
  { sure: 50, gamble: 300 },  // EV=150
  { sure: 50, gamble: 500 },  // EV=250
];

export default function RiskPreferenceTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState([]); // 'sure' | 'gamble'
  const [history, setHistory] = useState([]);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('risk-preference')), []);

  const q = LADDER[Math.min(idx, LADDER.length - 1)];
  const ev = Math.round(q.gamble / 2);

  const choose = (v) => {
    if (phase !== 'go') return;
    const next = [...choices, v];
    setChoices(next);
    if (next.length >= LADDER.length) {
      const risky = next.filter((c) => c === 'gamble').length;
      const firstRisky = next.indexOf('gamble');
      setHistory(appendHistory('risk-preference', { score: risky, percentile: null, firstRisky: firstRisky === -1 ? null : firstRisky + 1 }));
      setPhase('done');
    } else {
      setIdx(idx + 1);
    }
  };

  const restart = () => { setChoices([]); setIdx(0); setPhase('go'); };

  const finished = phase === 'done';
  const riskyCount = choices.filter((c) => c === 'gamble').length;
  const firstRisky = choices.indexOf('gamble');

  return (
    <div className="rp">
      <div className="rp-status" aria-live="polite">
        {phase === 'idle' && '六道二选一 · 没有对错，选你的真实偏好'}
        {phase === 'go' && `第 ${idx + 1}/${LADDER.length} 题`}
        {finished && '完成！点击任意处重测'}
      </div>

      <div className="rp-stage" onClick={() => { if (finished) restart(); }}>
        {phase === 'idle' && <span className="rp-q">点击开始</span>}
        {phase === 'go' && (
          <>
            <p className="rp-question">你选哪个？</p>
            <div className="rp-options">
              <button type="button" className="rp-opt" onClick={() => choose('sure')}>
                <strong>确定拿 {q.sure} 元</strong>
                <small>100% 概率</small>
              </button>
              <button type="button" className="rp-opt" onClick={() => choose('gamble')}>
                <strong>50% 拿 {q.gamble} 元</strong>
                <small>期望值 {ev} 元 · 否则 0 元</small>
              </button>
            </div>
          </>
        )}
        {finished && (
          <span className="rp-q">
            冒险 {riskyCount}/{LADDER.length} 次<br />
            <small>{firstRisky === -1 ? '全程保守——期望值更高也没能吸引你冒险' : `第 ${firstRisky + 1} 题起开始冒险（期望值 ${Math.round(LADDER[firstRisky].gamble / 2)} 元）`} · 点击重测</small>
          </span>
        )}
      </div>

      <TestResult
        value={finished ? riskyCount : null}
        unit={` / ${LADDER.length}`}
        extra={finished ? `首次冒险位置：${firstRisky === -1 ? '全程未冒险' : `第 ${firstRisky + 1} 题`}` : null}
        percentile={null}
        normNote="实验性指标：风险偏好无对错、无标准参考分布，不做百分位对比。阶梯固定：确定 50 元 vs 50% 拿 100→500 元（期望值递增），冒险次数越多表示风险容忍越高。"
        history={history}
        unitLabel=" 次"
      />
    </div>
  );
}
