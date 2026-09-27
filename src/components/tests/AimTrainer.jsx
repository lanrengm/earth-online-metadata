import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * 手眼精度（Aim trainer）：目标点在区域内随机出现，点中即换位，限时 30 秒。
 * 指标 = 命中间隔中位数（ms）+ 命中数。点空不惩罚。
 */
const DURATION_MS = 30000;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomPos = () => 10 + Math.random() * 80; // 百分比，留边距

// 参考分布：公开网络大样本（Human Benchmark 风格自选样本）瞄准均时约 600ms/目标，
// 取正态近似 μ=650 σ=200。非随机抽样、非临床常模，仅供粗略对照。
const NORM = { mean: 650, sd: 200 };

export default function AimTrainer() {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0);
  const [remainMs, setRemainMs] = useState(DURATION_MS);
  const [result, setResult] = useState(null); // {avg, med, hits, percentile}
  const [history, setHistory] = useState([]);
  const startAtRef = useRef(0);
  const lastHitRef = useRef(0);
  const gapsRef = useRef([]);
  const hitsRef = useRef(0);
  const endTimerRef = useRef(null);
  const tickTimerRef = useRef(null);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('aim-trainer')), []);
  useEffect(() => () => { clearTimeout(endTimerRef.current); clearInterval(tickTimerRef.current); }, []);

  const spawn = () => setPos({ x: randomPos(), y: randomPos() });

  const start = () => {
    setHits(0);
    hitsRef.current = 0;
    gapsRef.current = [];
    setResult(null);
    setRemainMs(DURATION_MS);
    startAtRef.current = monotonicNow();
    lastHitRef.current = monotonicNow();
    spawn();
    setPhase('running');
    tickTimerRef.current = setInterval(() => {
      setRemainMs(Math.max(0, DURATION_MS - (monotonicNow() - startAtRef.current)));
    }, 200);
    endTimerRef.current = setTimeout(() => {
      clearInterval(tickTimerRef.current);
      setRemainMs(0);
      setPhase('done');
      const gaps = gapsRef.current;
      if (gaps.length) {
        const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        const p = percentile(avg, NORM);
        setResult({ avg, med: median(gaps), hits: hitsRef.current, percentile: p });
        setHistory(appendHistory('aim-trainer', { score: avg, percentile: p, hits: hitsRef.current }));
      }
    }, DURATION_MS);
  };

  const handleStartClick = () => {
    if (phase === 'idle' || phase === 'done') start();
  };

  const handleTargetClick = () => {
    if (phase !== 'running') return;
    const now = monotonicNow();
    if (hitsRef.current > 0) gapsRef.current.push(now - lastHitRef.current);
    lastHitRef.current = now;
    hitsRef.current += 1;
    setHits(hitsRef.current);
    spawn();
  };

  const finished = phase === 'done';

  return (
    <div className="at">
      <div className="at-status" aria-live="polite">
        {phase === 'idle' && '点中随机出现的目标 · 限时 30 秒 · 点空不扣'}
        {phase === 'running' && `剩余 ${(remainMs / 1000).toFixed(1)}s · 命中 ${hits}`}
        {finished && `时间到 · 命中 ${hits} 个 · 点击区域再测`}
      </div>

      <div className="at-area" onClick={handleStartClick}>
        {phase === 'running' && (
          <button
            type="button"
            className="at-target"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={(e) => { e.stopPropagation(); handleTargetClick(); }}
            aria-label="目标"
          />
        )}
        {phase !== 'running' && (
          <span className="at-idle">
            {finished && result ? `平均 ${result.avg} ms/目标\n（中位 ${result.med} ms · 共 ${result.hits} 个）` : '点击开始'}
          </span>
        )}
      </div>

      <TestResult
        value={finished && result ? result.avg : null}
        unit=" ms"
        extra={result ? `平均命中间隔 · 30 秒命中 ${result.hits} 个（中位 ${result.med} ms）` : null}
        percentile={finished && result ? result.percentile : null}
        normNote="参考分布：公开网络大样本瞄准任务均时（约 600ms/目标，正态近似 μ=650 σ=200）。受设备触控/鼠标与屏幕尺寸影响，非临床常模，仅供粗略对照。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
