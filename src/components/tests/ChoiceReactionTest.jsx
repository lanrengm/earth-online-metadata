import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * 选择反应（4 选 1）：随机一个方块亮起 → 点它。8 个有效轮取正确轮中位数，另计错误率。
 * 计时 performance.now()；亮起前点击不计轮（防抢跑）。
 */
const ROUNDS = 8;
const TARGETS = ['上', '右', '下', '左'];

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomDelay = (min, max) => min + Math.random() * (max - min);
const randomTarget = () => Math.floor(Math.random() * 4);

// 参考分布：文献量级参考——成人 4 选 1 反应时约在 450-600ms 区间，
// 取正态近似 μ=520 σ=100。非严格常模，仅供粗略对照。
const NORM = { mean: 520, sd: 100 };

export default function ChoiceReactionTest() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | done
  const [target, setTarget] = useState(-1); // 0上 1右 2下 3左
  const [rts, setRts] = useState([]);
  const [errors, setErrors] = useState(0);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss' 短暂反馈
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);
  const timerRef = useRef(null);
  const flashTimer = useRef(null);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('choice-reaction')), []);
  useEffect(() => () => { clearTimeout(timerRef.current); clearTimeout(flashTimer.current); }, []);

  const startRound = (prevTarget) => {
    setPhase('waiting');
    timerRef.current = setTimeout(() => {
      let idx = randomTarget();
      if (idx === prevTarget) idx = (idx + 1 + randomTarget() * 2) % 4; // 降低连续同目标概率
      setTarget(idx);
      goAtRef.current = monotonicNow();
      setPhase('go');
    }, randomDelay(800, 3000));
  };

  const begin = () => {
    setRts([]);
    setErrors(0);
    setTarget(-1);
    startRound(-1);
  };

  const pick = (idx) => {
    if (phase === 'idle' || phase === 'done') { begin(); return; }
    if (phase !== 'go') return;
    const rt = Math.round(monotonicNow() - goAtRef.current);
    clearTimeout(timerRef.current);
    if (idx === target) {
      const next = [...rts, rt];
      setFlash('hit');
      if (next.length >= ROUNDS) {
        const med = median(next);
        const p = percentile(med, NORM);
        setHistory(appendHistory('choice-reaction', { score: med, percentile: p, errors: errors }));
        setRts(next);
        setPhase('done');
      } else {
        setRts(next);
        setTarget(-1);
        startRound(target);
      }
    } else {
      setErrors((e) => e + 1);
      setFlash('miss');
    }
    flashTimer.current = setTimeout(() => setFlash(null), 350);
  };

  const finished = phase === 'done';
  const med = finished ? median(rts) : null;
  const p = finished ? percentile(med, NORM) : 0;
  const totalAttempts = rts.length + errors;

  return (
    <div className="cr">
      <div className="cr-status" aria-live="polite">
        {phase === 'idle' && '点击下方任意方块开始 · 亮哪个点哪个，共 8 轮'}
        {phase === 'waiting' && '等待亮起…'}
        {phase === 'go' && '点它！'}
        {finished && '完成！点击方块再测一次'}
      </div>

      <div className="cr-grid">
        {TARGETS.map((t, i) => (
          <button
            key={t}
            type="button"
            className={`cr-cell ${phase === 'go' && target === i ? 'is-active' : ''} ${flash === 'hit' && phase !== 'go' && target === i ? 'is-hit' : ''} ${flash === 'miss' ? 'is-miss' : ''}`}
            onClick={() => pick(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {rts.length > 0 && <p className="cr-rounds">有效 {rts.length}/{ROUNDS} 轮 · 误点 {errors} 次</p>}

      <TestResult
        value={finished ? med : null}
        unit=" ms"
        extra={`正确轮中位数 · 正确率 ${totalAttempts ? Math.round((rts.length / totalAttempts) * 100) : 100}%（误点 ${errors}）`}
        percentile={p}
        normNote="参考分布：4 选 1 反应时文献量级参考（450-600ms 区间，正态近似 μ=520 σ=100）。非严格常模，仅供粗略对照。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
