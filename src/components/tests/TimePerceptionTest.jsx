import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median } from '../../lib/testutils.js';

/**
 * 时间感知：屏幕给出目标时长（如「估 5 秒」），开始后凭内部感觉按停止。
 * 指标 = 估计误差 |实际−目标| / 目标 × 100%，5 轮取中位数。
 * 实验性指标：无公开参考分布，结果与本机历史对照（决策 #16 数据红线）。
 */
const ROUNDS = 5;
const TARGETS = [5, 12, 5, 12, 8]; // 秒，混合防止节奏记忆

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();

export default function TimePerceptionTest() {
  const [phase, setPhase] = useState('idle'); // idle | running | feedback | done
  const [round, setRound] = useState(0);
  const [errorsPct, setErrorsPct] = useState([]); // 每轮误差百分数
  const [lastTrial, setLastTrial] = useState(null); // {target, actual, errPct}
  const [history, setHistory] = useState([]);
  const startAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('time-perception')), []);

  const target = TARGETS[Math.min(round, TARGETS.length - 1)];

  const begin = () => {
    setLastTrial(null);
    startAtRef.current = monotonicNow();
    setPhase('running');
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'done') { setErrorsPct([]); setRound(0); begin(); return; }
    if (phase !== 'running') return;
    const actual = (monotonicNow() - startAtRef.current) / 1000;
    const errPct = Math.round(Math.abs(actual - target) / target * 1000) / 10;
    const trial = { target, actual: Math.round(actual * 10) / 10, errPct };
    setLastTrial(trial);
    const next = [...errorsPct, errPct];
    setErrorsPct(next);
    if (next.length >= ROUNDS) {
      const med = median(next);
      setHistory(appendHistory('time-perception', { score: med, percentile: null }));
      setPhase('done');
    } else {
      setRound(round + 1);
      setPhase('feedback');
    }
  };

  const finished = phase === 'done';
  const med = finished ? median(errorsPct) : null;

  return (
    <div className="tp">
      <div className="tp-status" aria-live="polite">
        {phase === 'idle' && `第 1/${ROUNDS} 轮 · 心里默数 ${TARGETS[0]} 秒后点击`}
        {phase === 'running' && `默数 ${target} 秒… 觉得到了就点`}
        {phase === 'feedback' && `下一轮：估 ${target} 秒 · 点击开始`}
        {finished && '完成！点击再测一次'}
      </div>

      <button type="button" className={`tp-pad ${phase === 'running' ? 'is-running' : ''}`} onClick={handleClick}>
        {phase === 'idle' && <span>点击开始<br /><small>不看钟，凭感觉估 {TARGETS[0]} 秒</small></span>}
        {phase === 'running' && <span>计时中…<br /><small>觉得 {target} 秒到了就点</small></span>}
        {phase === 'feedback' && lastTrial && (
          <span className="tp-feedback">
            目标 {lastTrial.target}s · 实际 {lastTrial.actual}s<br />
            <small>误差 {lastTrial.errPct}% · 点击继续</small>
          </span>
        )}
        {phase === 'done' && <span>再测一次<br /><small>误差中位数 {med}%</small></span>}
      </button>

      {errorsPct.length > 0 && (
        <p className="rt-rounds">
          {errorsPct.map((e, i) => <span key={i} className="rt-chip">{e}%</span>)}
        </p>
      )}

      <TestResult
        value={finished ? med : null}
        unit=" %"
        extra="5 轮估计误差中位数（相对目标时长）· 越小越准"
        percentile={null}
        normNote="实验性指标：内部时钟精度无公开标准参考分布，不做百分位对比，请以本机历史自我对照。目标时长混合 5s/8s/12s。"
        history={history}
        unitLabel="%"
      />
    </div>
  );
}
