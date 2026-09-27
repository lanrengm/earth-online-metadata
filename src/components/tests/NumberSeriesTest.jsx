import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median } from '../../lib/testutils.js';

/**
 * 逻辑推理（数列）：10 题难度递增的数列，四选一。
 * 指标 = 正确率 + 正确题中位用时。实验性指标：无公开参考分布（决策 #16）。
 */
const QUESTIONS = [
  { seq: '2, 4, 6, 8, ?', options: [9, 10, 11, 12], answer: 10 },
  { seq: '1, 3, 5, 7, ?', options: [8, 9, 10, 11], answer: 9 },
  { seq: '1, 2, 4, 8, ?', options: [12, 14, 16, 32], answer: 16 },
  { seq: '5, 10, 20, 40, ?', options: [50, 60, 80, 100], answer: 80 },
  { seq: '1, 1, 2, 3, 5, ?', options: [6, 7, 8, 11], answer: 8 },
  { seq: '2, 3, 5, 7, 11, ?', options: [12, 13, 14, 15], answer: 13 },
  { seq: '1, 4, 9, 16, ?', options: [20, 24, 25, 36], answer: 25 },
  { seq: '2, 6, 12, 20, ?', options: [24, 28, 30, 32], answer: 30 },
  { seq: '1, 8, 27, ?', options: [36, 54, 64, 81], answer: 64 },
  { seq: '3, 4, 6, 9, 13, ?', options: [16, 17, 18, 19], answer: 18 },
];

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();

export default function NumberSeriesTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [rts, setRts] = useState([]);
  const [picked, setPicked] = useState(null); // 答题反馈高亮
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('number-series')), []);

  const q = QUESTIONS[Math.min(idx, QUESTIONS.length - 1)];

  const begin = () => { setIdx(0); setCorrect(0); setRts([]); setPicked(null); goAtRef.current = monotonicNow(); setPhase('go'); };

  const pick = (v) => {
    if (phase !== 'go' || picked !== null) return;
    setPicked(v);
    const ok = v === q.answer;
    if (ok) {
      setCorrect((c) => c + 1);
      setRts((r) => [...r, Math.round(monotonicNow() - goAtRef.current)]);
    }
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= QUESTIONS.length) {
        setIdx(QUESTIONS.length);
        setPhase('done');
        const accuracy = Math.round(((correct + (ok ? 1 : 0)) / QUESTIONS.length) * 100);
        const medRt = median(rts);
        setHistory(appendHistory('number-series', { score: accuracy, percentile: null, medianRt: medRt }));
      } else {
        setIdx(idx + 1);
        goAtRef.current = monotonicNow();
      }
    }, 450);
  };

  const finished = phase === 'done';
  const med = rts.length ? median(rts) : 0;

  return (
    <div className="ns">
      <div className="ns-status" aria-live="polite">
        {phase === 'idle' && `共 ${QUESTIONS.length} 题，难度递增 · 找规律选下一个数`}
        {phase === 'go' && `第 ${idx + 1}/${QUESTIONS.length} 题 · 答对 ${correct}`}
        {finished && '完成！点击屏幕再测一次'}
      </div>

      <button
        type="button"
        className="ns-stage"
        onClick={() => { if (finished) begin(); }}
        disabled={phase === 'go'}
      >
        {phase === 'idle' && <span className="ns-seq">点击开始</span>}
        {phase === 'go' && <span className="ns-seq">{q.seq}</span>}
        {finished && <span className="ns-seq">正确率 {Math.round((correct / QUESTIONS.length) * 100)}%<br /><small>正确题平均用时 {med || 0} ms · 点击再测</small></span>}
      </button>

      {phase === 'go' && (
        <div className="ns-options">
          {q.options.map((v) => (
            <button
              key={v}
              type="button"
              className={`ns-opt ${picked !== null && v === q.answer ? 'is-right' : ''} ${picked === v && v !== q.answer ? 'is-wrong' : ''}`}
              onClick={() => pick(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <TestResult
        value={finished ? Math.round((correct / QUESTIONS.length) * 100) : null}
        unit=" %"
        extra={`答对 ${correct}/${QUESTIONS.length} · 正确题中位用时 ${med} ms`}
        percentile={null}
        normNote="实验性指标：数列推理无公开标准参考分布，不做百分位对比，请以本机历史自我对照。题库固定 10 题，做过会记得答案，适合隔数日复测。"
        history={history}
        unitLabel="%"
      />
    </div>
  );
}
