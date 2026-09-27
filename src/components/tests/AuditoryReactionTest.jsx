import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * 听觉简单反应：等待提示音 → 立即点击。5 轮取中位数。
 * Web Audio API 生成 880Hz 短音；AudioContext 须在用户手势后创建（浏览器 autoplay 策略）。
 */
const ROUNDS = 5;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomDelay = (min, max) => min + Math.random() * (max - min);

// 参考分布：听觉简单反应时通常较视觉略快，文献常见 150-250ms 区间。
// 取正态近似 μ=220 σ=55，含常见音频输出延迟。非临床常模，仅供粗略对照。
const NORM = { mean: 220, sd: 55 };

function playBeep(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

export default function AuditoryReactionTest() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | done
  const [rts, setRts] = useState([]);
  const [early, setEarly] = useState(false);
  const [lastRt, setLastRt] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const audioRef = useRef(null);
  const goAtRef = useRef(0);
  const timerRef = useRef(null);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('auditory-reaction')), []);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
    return audioRef.current;
  };

  const startRound = () => {
    setEarly(false);
    setPhase('waiting');
    timerRef.current = setTimeout(() => {
      try {
        playBeep(audioRef.current);
      } catch {
        setError('音频播放失败，请检查设备音量后重新开始');
        setPhase('idle');
        return;
      }
      goAtRef.current = monotonicNow();
      setPhase('go');
    }, randomDelay(1200, 3500));
  };

  const begin = () => {
    try {
      ensureAudio();
    } catch {
      setError('当前浏览器不支持 Web Audio，无法进行听觉测试');
      return;
    }
    setError(null);
    startRound();
  };

  const handleClick = () => {
    if (phase === 'idle' || phase === 'done') {
      setRts([]);
      setLastRt(null);
      begin();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setEarly(true);
      setPhase('idle');
      return;
    }
    const rt = Math.round(monotonicNow() - goAtRef.current);
    setLastRt(rt);
    const next = [...rts, rt];
    if (next.length < ROUNDS) {
      setRts(next);
      startRound();
    } else {
      const med = median(next);
      const p = percentile(med, NORM);
      setHistory(appendHistory('auditory-reaction', { score: med, percentile: p }));
      setRts(next);
      setPhase('done');
    }
  };

  const finished = phase === 'done';
  const med = finished ? median(rts) : null;
  const p = finished ? percentile(med, NORM) : 0;

  return (
    <div className="ar">
      <button
        type="button"
        className={`ar-pad ${phase === 'go' ? 'is-go' : phase === 'waiting' ? 'is-waiting' : ''}`}
        onClick={handleClick}
      >
        {phase === 'idle' && (early
          ? <span className="rt-early">抢跑了！点击重新开始本轮</span>
          : <span>点击开始<br /><small>听到「哔」声的瞬间点击，共 {ROUNDS} 轮 · 建议戴耳机</small></span>)}
        {phase === 'waiting' && <span>等待提示音…</span>}
        {phase === 'go' && <span>点击！</span>}
        {phase === 'done' && <span>再测一次</span>}
      </button>
      {error && <p className="ar-error">{error}</p>}

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
        percentile={finished ? p : null}
        normNote="参考分布：文献量级——听觉简单反应时常较视觉略快（150-250ms 区间），正态近似 μ=220 σ=55，含常见音频输出延迟。非临床常模，仅供粗略对照。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
