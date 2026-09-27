import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * 视觉简单反应：等待屏幕变绿 → 立即点击。5 轮取中位数。
 * 计时 performance.now()，抢跑（变绿前点击）该轮作废重试。
 */
const ROUNDS = 5;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomDelay = (min, max) => min + Math.random() * (max - min);

// 参考分布：公开网络大样本（Human Benchmark 风格自选样本）成人简单视反应时，
// 中位约 273ms。非随机抽样、非临床常模，仅供粗略对照。
const NORM = { mean: 273, sd: 60 };

export default function ReactionTest() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | done
  const [rts, setRts] = useState([]);
  const [early, setEarly] = useState(false);
  const [lastRt, setLastRt] = useState(null);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);
  const timerRef = useRef(null);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('reaction-time')), []);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startRound = () => {
    setEarly(false);
    setPhase('waiting');
    timerRef.current = setTimeout(() => {
      goAtRef.current = monotonicNow();
      setPhase('go');
    }, randomDelay(1200, 3500));
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'done') {
      setRts([]);
      setLastRt(null);
      startRound();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setEarly(true);
      setPhase('idle');
      return;
    }
    // go
    const rt = Math.round(monotonicNow() - goAtRef.current);
    setLastRt(rt);
    const next = [...rts, rt];
    if (next.length < ROUNDS) {
      setRts(next);
      startRound();
    } else {
      const med = median(next);
      const p = percentile(med, NORM);
      setHistory(appendHistory('reaction-time', { score: med, percentile: p }));
      setRts(next);
      setPhase('done');
    }
  };

  const finished = phase === 'done';
  const med = finished ? median(rts) : null;
  const p = finished ? percentile(med, NORM) : 0;

  return (
    <div className="rt">
      <button
        type="button"
        className={`rt-pad ${phase === 'go' ? 'is-go' : phase === 'waiting' ? 'is-waiting' : ''}`}
        onClick={handleClick}
      >
        {phase === 'idle' && (early ? <span className="rt-early">抢跑了！点击重新开始本轮</span> : <span>点击开始<br /><small>屏幕变绿的瞬间点击，共 {ROUNDS} 轮</small></span>)}
        {phase === 'waiting' && <span>等待变绿…</span>}
        {phase === 'go' && <span>点击！</span>}
        {phase === 'done' && <span>再测一次</span>}
      </button>

      {rts.length > 0 && (
        <p className="rt-rounds">
          {rts.map((rt, i) => <span key={i} className="rt-chip">{rt} ms</span>)}
          {phase === 'waiting' && <span className="rt-chip is-pending">…</span>}
        </p>
      )}
      {lastRt !== null && !finished && <p className="rt-last">上一轮 {lastRt} ms</p>}

      <TestResult
        value={finished ? med : null}
        unit=" ms"
        extra={`${ROUNDS} 轮中位数（各轮：${rts.join(' / ')}）`}
        percentile={p}
        normNote="参考分布：公开网络大样本成人简单视反应时（中位约 273ms，正态近似 σ=60）。网络自选样本，非随机抽样、非临床常模，仅供粗略对照。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
