import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median } from '../../lib/testutils.js';

/**
 * 视觉搜索（特征搜索 pop-out）：网格中 1 个目标符号（★）+ 其余干扰（▲），
 * 点击目标。5 轮取中位数。点击干扰计误点不计轮。
 * 实验性指标：无公开参考分布，结果与本机历史对照（决策 #16 数据红线）。
 */
const ROUNDS = 5;
const SIZE = 6; // 6×6 = 36 格
const DISTRACTOR = '▲';
const TARGET = '★';

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();

function makeGrid() {
  const targetIdx = Math.floor(Math.random() * SIZE * SIZE);
  return Array.from({ length: SIZE * SIZE }, (_, i) => i === targetIdx);
}

export default function VisualSearchTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [grid, setGrid] = useState([]);
  const [rts, setRts] = useState([]);
  const [errors, setErrors] = useState(0);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('visual-search')), []);

  const begin = () => {
    setRts([]);
    setErrors(0);
    setGrid(makeGrid());
    goAtRef.current = monotonicNow();
    setPhase('go');
  };

  const pick = (isTarget) => {
    if (phase === 'idle' || phase === 'done') { begin(); return; }
    if (phase !== 'go') return;
    if (!isTarget) {
      setErrors((e) => e + 1);
      return;
    }
    const rt = Math.round(monotonicNow() - goAtRef.current);
    const next = [...rts, rt];
    if (next.length >= ROUNDS) {
      const med = median(next);
      setHistory(appendHistory('visual-search', { score: med, percentile: null }));
      setRts(next);
      setPhase('done');
    } else {
      setRts(next);
      setGrid(makeGrid());
      goAtRef.current = monotonicNow();
    }
  };

  const finished = phase === 'done';
  const med = finished ? median(rts) : null;

  return (
    <div className="vs">
      <div className="vs-status" aria-live="polite">
        {phase === 'idle' && '找到唯一的 ★ 并点击 · 共 5 轮，越快越好'}
        {phase === 'go' && `★ 藏在下面 · 有效 ${rts.length}/${ROUNDS} 轮${errors ? ` · 误点 ${errors}` : ''}`}
        {finished && '完成！点击网格再测一次'}
      </div>

      <div className="vs-grid" role="grid" aria-label="视觉搜索网格">
        {(phase === 'go' ? grid : Array(SIZE * SIZE).fill(false)).map((isTarget, i) => (
          <button key={i} type="button" className={`vs-cell ${isTarget ? 'is-target' : ''}`} onClick={() => pick(isTarget)} aria-hidden={phase !== 'go'}>
            {isTarget ? TARGET : DISTRACTOR}
          </button>
        ))}
      </div>

      {rts.length > 0 && (
        <p className="rt-rounds">
          {rts.map((rt, i) => <span key={i} className="rt-chip">{(rt / 1000).toFixed(2)} s</span>)}
        </p>
      )}

      <TestResult
        value={finished ? (med / 1000).toFixed(2) : null}
        unit=" s"
        extra={`5 轮中位数 · 误点 ${errors} 次`}
        percentile={null}
        normNote="实验性指标：特征搜索（pop-out）目前无公开标准参考分布，不做百分位对比，请以本机历史自我对照。干扰密度固定为 36 格。"
        history={history}
        unitLabel="s"
      />
    </div>
  );
}
