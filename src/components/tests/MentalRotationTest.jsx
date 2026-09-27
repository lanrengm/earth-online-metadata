import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * 心理旋转（2D 字母版，Cooper & Shepard 范式简化）：
 * 左侧正立字母 R，右侧同形但旋转 θ（0-315°）的字母——可能原地旋转（相同）或镜像（相反）。
 * 判断「相同 / 相反」。10 个有效轮取正确轮中位数 + 正确率。
 */
const ROUNDS = 10;
const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomIdx = (n) => Math.floor(Math.random() * n);

// 参考分布：文献量级——成人单题 2D 心理旋转判断常见 1.5-4.5s，
// 取正态近似 μ=3000 σ=1000。非严格常模，仅供粗略对照。
const NORM = { mean: 3000, sd: 1000 };

export default function MentalRotationTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [angle, setAngle] = useState(0);
  const [mirrored, setMirrored] = useState(false);
  const [rts, setRts] = useState([]);
  const [errors, setErrors] = useState(0);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('mental-rotation')), []);

  const totalValid = rts.length;

  const nextTrial = () => {
    setAngle(ANGLES[randomIdx(ANGLES.length)]);
    setMirrored(randomIdx(2) === 1);
    goAtRef.current = monotonicNow();
    setPhase('go');
  };

  const begin = () => { setRts([]); setErrors(0); nextTrial(); };

  const answer = (saidSame) => {
    if (phase === 'idle' || phase === 'done') { begin(); return; }
    if (phase !== 'go') return;
    if (saidSame === mirrored) { // 镜像却答相同 = 错
      setErrors((e) => e + 1);
      return;
    }
    const rt = Math.round(monotonicNow() - goAtRef.current);
    const next = [...rts, rt];
    if (next.length >= ROUNDS) {
      const med = median(next);
      const p = percentile(med, NORM);
      setHistory(appendHistory('mental-rotation', { score: med, percentile: p, errors: errors }));
      setRts(next);
      setPhase('done');
    } else {
      setRts(next);
      nextTrial();
    }
  };

  const finished = phase === 'done';
  const med = finished ? median(rts) : null;
  const p = finished ? percentile(med, NORM) : 0;
  const attempts = totalValid + errors;

  return (
    <div className="mr">
      <div className="mr-status" aria-live="polite">
        {phase === 'idle' && '右边和左边的 R 是「旋转后相同」还是「镜像」？· 共 10 轮'}
        {phase === 'go' && `有效 ${totalValid}/${ROUNDS} 轮${errors ? ` · 误答 ${errors}` : ''}`}
        {finished && '完成！点击图形再测一次'}
      </div>

      <div className="mr-stage" onClick={() => { if (phase === 'idle' || phase === 'done') begin(); }} role="img" aria-label="左侧正立字母 R 与右侧旋转字母 R 对比">
        <div className="mr-letter">R</div>
        <div
          className={`mr-letter mr-right ${mirrored ? 'is-mirror' : ''}`}
          style={{ transform: `rotate(${angle}deg)${mirrored ? ' scaleX(-1)' : ''}` }}
        >
          R
        </div>
      </div>

      <div className="mr-buttons">
        <button type="button" className="app-btn secondary" onClick={() => answer(false)} disabled={phase !== 'go'}>旋转后相同</button>
        <button type="button" className="app-btn" onClick={() => answer(true)} disabled={phase !== 'go'}>镜 像</button>
      </div>

      <TestResult
        value={finished ? (med / 1000).toFixed(2) : null}
        unit=" s"
        extra={`正确轮中位数 · 正确率 ${attempts ? Math.round((totalValid / attempts) * 100) : 100}%（误答 ${errors}）`}
        percentile={finished ? p : null}
        normNote="参考分布：文献量级——成人单题 2D 心理旋转判断常见 1.5-4.5s，正态近似 μ=3000 σ=1000。非严格常模，仅供粗略对照。"
        history={history}
        unitLabel="s"
      />
    </div>
  );
}
