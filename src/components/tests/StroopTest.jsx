import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median, percentile } from '../../lib/testutils.js';

/**
 * Stroop 干扰（颜色词版）：屏幕出现一个颜色词（字色与词义一致或冲突），
 * 按字的「颜色」点对应色块，无视字义。12 个有效轮：
 * 主指标 = 冲突轮中位数，附加一致轮中位数与 Stroop 效应量（冲突-一致）。
 */
const ROUNDS = 12;
const COLORS = [
  { name: '红', css: '#e53935' },
  { name: '蓝', css: '#1e88e5' },
  { name: '绿', css: '#43a047' },
  { name: '黄', css: '#f0b429' },
];

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomIdx = (n) => Math.floor(Math.random() * n);

// 参考分布：文献量级——成人按键式颜色词 Stroop 冲突条件常见 750-1000ms，
// 取正态近似 μ=850 σ=160。非严格常模，仅供粗略对照。
const NORM = { mean: 850, sd: 160 };

export default function StroopTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [word, setWord] = useState(null); // { text, colorIdx }
  const [congruent, setCongruent] = useState(false);
  const [rtsC, setRtsC] = useState([]); // 一致轮
  const [rtsI, setRtsI] = useState([]); // 冲突轮
  const [errors, setErrors] = useState(0);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('stroop')), []);

  const totalValid = rtsC.length + rtsI.length;

  const nextTrial = () => {
    const isCong = randomIdx(2) === 0;
    const colorIdx = randomIdx(4);
    let wordIdx = colorIdx;
    if (!isCong) {
      do { wordIdx = randomIdx(4); } while (wordIdx === colorIdx);
    }
    setCongruent(isCong);
    setWord({ text: COLORS[wordIdx].name, colorIdx });
    goAtRef.current = monotonicNow();
    setPhase('go');
  };

  const begin = () => {
    setRtsC([]);
    setRtsI([]);
    setErrors(0);
    nextTrial();
  };

  const pick = (colorIdx) => {
    if (phase === 'idle' || phase === 'done') { begin(); return; }
    if (phase !== 'go') return;
    if (colorIdx !== word.colorIdx) {
      setErrors((e) => e + 1);
      return;
    }
    const rt = Math.round(monotonicNow() - goAtRef.current);
    const nextC = congruent ? [...rtsC, rt] : rtsC;
    const nextI = congruent ? rtsI : [...rtsI, rt];
    setRtsC(nextC);
    setRtsI(nextI);
    if (nextC.length + nextI.length >= ROUNDS) {
      const medI = median(nextI);
      const p = percentile(medI, NORM);
      setHistory(appendHistory('stroop', { score: medI, percentile: p, errors: errors }));
      setPhase('done');
    } else {
      nextTrial();
    }
  };

  const finished = phase === 'done';
  const medI = finished ? median(rtsI) : null;
  const medC = finished ? median(rtsC) : 0;
  const p = finished ? percentile(medI, NORM) : 0;
  const attempts = totalValid + errors;

  return (
    <div className="st">
      <div className="st-status" aria-live="polite">
        {phase === 'idle' && '按「字的颜色」点下方色块，无视文字含义 · 共 12 轮'}
        {phase === 'go' && '它是什么颜色？'}
        {finished && '完成！点击色块再测一次'}
      </div>

      <button type="button" className={`st-word ${phase === 'go' ? '' : 'is-idle'}`} onClick={() => pick(-1)} disabled={phase !== 'go'}>
        {phase === 'go' ? word.text : (finished ? '再测' : '开始')}
      </button>

      <div className="st-palette">
        {COLORS.map((c, i) => (
          <button key={c.name} type="button" className="st-swatch" style={{ background: c.css }} onClick={() => pick(i)} aria-label={`颜色 ${c.name}`}></button>
        ))}
      </div>

      {totalValid > 0 && !finished && <p className="st-rounds">有效 {totalValid}/{ROUNDS} 轮 · 误点 {errors} 次</p>}

      <TestResult
        value={finished ? medI : null}
        unit=" ms"
        extra={`冲突轮中位数 · 一致轮 ${medC}ms · Stroop 效应 ${medI && medC ? medI - medC : 0}ms · 正确率 ${attempts ? Math.round((totalValid / attempts) * 100) : 100}%`}
        percentile={finished ? p : null}
        normNote="参考分布：文献量级——按键式颜色词 Stroop 冲突条件常见 750-1000ms，正态近似 μ=850 σ=160。非严格常模，仅供粗略对照；效应量（冲突-一致）越大说明字义干扰越强。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
