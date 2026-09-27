import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory } from '../../lib/testutils.js';

/**
 * 色觉辨别：3×3 同色块中 1 个亮度略异，点击异色块。答对色差缩小进下一级，错扣 1 命（共 3）。
 * 指标 = 达到的级别（色差阈值）。结果受设备屏幕素质影响大，实验性指标（决策 #16）。
 */
const SIZE = 9;
const START_DELTA = 26; // HSL 亮度差
const DECAY = 0.72;
const LIVES = 3;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const randomIdx = (n) => Math.floor(Math.random() * n);

export default function ColorVisionTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(LIVES);
  const [target, setTarget] = useState(0);
  const [colors, setColors] = useState({ base: '', target: '' });
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const [history, setHistory] = useState([]);
  const timersRef = useRef([]);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('color-vision')), []);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const spawnLevel = (lv) => {
    const hue = randomIdx(360);
    const d = Math.max(3, START_DELTA * Math.pow(DECAY, lv - 1));
    const dir = randomIdx(2) === 0 ? 1 : -1;
    const baseL = 55;
    const targetL = Math.min(85, Math.max(20, baseL + dir * d));
    setColors({
      base: `hsl(${hue}, 65%, ${baseL}%)`,
      target: `hsl(${hue}, 65%, ${targetL}%)`,
    });
    setTarget(randomIdx(SIZE));
  };

  const begin = () => { setLevel(1); setLives(LIVES); spawnLevel(1); setPhase('go'); };

  const start = () => { if (phase === 'idle' || phase === 'done') begin(); };

  const pickCell = (i) => {
    if (phase !== 'go') return;
    if (i === target) {
      setFlash('hit');
      setLevel(level + 1);
      timersRef.current.push(setTimeout(() => { setFlash(null); spawnLevel(level + 1); }, 250));
    } else {
      setFlash('miss');
      const left = lives - 1;
      setLives(left);
      timersRef.current.push(setTimeout(() => {
        setFlash(null);
        if (left <= 0) {
          setHistory(appendHistory('color-vision', { score: level, percentile: null }));
          setPhase('done');
        } else {
          spawnLevel(level);
        }
      }, 350));
    }
  };

  return (
    <div className="cv">
      <div className="cv-status" aria-live="polite">
        {phase === 'idle' && '9 个色块中有 1 个颜色略不同 · 点出来 · 3 条命'}
        {phase === 'go' && `第 ${level} 级 · 剩余生命 ${'❤'.repeat(lives) || '—'}`}
        {phase === 'done' && `达到第 ${level} 级 · 点击网格再测一次`}
      </div>

      <div className="vs-grid cv-grid" onClick={start}>
        {Array.from({ length: SIZE }, (_, i) => (
          <button
            key={`${level}-${i}`}
            type="button"
            className={`vs-cell cv-cell ${flash === 'miss' && i === target ? 'is-miss' : ''}`}
            style={{ background: phase === 'go' ? (i === target ? colors.target : colors.base) : undefined }}
            onClick={(e) => { e.stopPropagation(); pickCell(i); }}
            disabled={phase !== 'go'}
            aria-label={`色块 ${i + 1}`}
          />
        ))}
      </div>

      <TestResult
        value={phase === 'done' ? level : null}
        unit=" 级"
        extra={phase === 'done' ? `色差阈值：亮度差约 ${(START_DELTA * Math.pow(DECAY, level - 1)).toFixed(1)}%（HSL）` : null}
        percentile={null}
        normNote="实验性指标：结果受设备屏幕色彩与亮度影响极大，无跨设备参考分布，不做百分位对比，请以本机历史自我对照。不能作为色觉障碍医学判断。"
        history={history}
        unitLabel="级"
      />
    </div>
  );
}
