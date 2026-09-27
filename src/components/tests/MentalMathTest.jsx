import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median } from '../../lib/testutils.js';

/**
 * 心算速度：10 题两位数加减乘（+/−/×循环），每题四选一，题干每局随机生成。
 * 指标 = 正确率% + 正确题中位用时。实验性指标：题难度随机，无标准常模（决策 #16）。
 */
const ROUNDS = 10;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function makeQuestion(op) {
  let a, b, ans, text;
  if (op === '+') {
    a = randInt(12, 89); b = randInt(12, 89); ans = a + b; text = `${a} + ${b}`;
  } else if (op === '−') {
    b = randInt(12, 79); a = b + randInt(10, 60); ans = a - b; text = `${a} − ${b}`;
  } else {
    a = randInt(3, 12); b = randInt(3, 19); ans = a * b; text = `${a} × ${b}`;
  }
  const deltas = [10, -10, 1, -1, 2, -2].map((d) => ans + d).filter((v) => v !== ans && v > 0);
  const options = [ans, ...new Set(deltas)].slice(0, 4);
  // 打乱选项
  for (let i = options.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { text, answer: ans, options };
}

function makeQuestions() {
  const ops = [];
  for (let i = 0; i < ROUNDS; i++) {
    const r = i % 3;
    ops.push(r === 0 ? '+' : r === 1 ? '−' : '×');
  }
  return ops.map(makeQuestion);
}

export default function MentalMathTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [rts, setRts] = useState([]);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('mental-math')), []);

  const q = questions[Math.min(idx, questions.length - 1)];

  const begin = () => {
    setQuestions(makeQuestions());
    setIdx(0);
    setCorrect(0);
    setRts([]);
    setPicked(null);
    goAtRef.current = monotonicNow();
    setPhase('go');
  };

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
      if (idx + 1 >= ROUNDS) {
        setIdx(ROUNDS);
        setPhase('done');
        const accuracy = Math.round(((correct + (ok ? 1 : 0)) / ROUNDS) * 100);
        const medRt = median(rts);
        setHistory(appendHistory('mental-math', { score: accuracy, percentile: null, medianRt: medRt }));
      } else {
        setIdx(idx + 1);
        goAtRef.current = monotonicNow();
      }
    }, 400);
  };

  const finished = phase === 'done';
  const med = rts.length ? median(rts) : 0;

  return (
    <div className="mm">
      <div className="ns-status" aria-live="polite">
        {phase === 'idle' && `共 ${ROUNDS} 题 · 加减乘循环 · 心算别用计算器`}
        {phase === 'go' && `第 ${idx + 1}/${ROUNDS} 题 · 答对 ${correct}`}
        {finished && '完成！点击屏幕再测一次'}
      </div>

      <button
        type="button"
        className="ns-stage mm-stage"
        onClick={() => { if (finished) begin(); }}
        disabled={phase === 'go'}
      >
        {phase === 'idle' && <span className="ns-seq">点击开始</span>}
        {phase === 'go' && <span className="ns-seq">{q.text} = ?</span>}
        {finished && <span className="ns-seq">正确率 {Math.round((correct / ROUNDS) * 100)}%<br /><small>正确题中位用时 {med} ms · 点击再测</small></span>}
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
        value={finished ? Math.round((correct / ROUNDS) * 100) : null}
        unit=" %"
        extra={`答对 ${correct}/${ROUNDS} · 正确题中位用时 ${med} ms`}
        percentile={null}
        normNote="实验性指标：题目每局随机生成、难度不固定，无标准参考分布，不做百分位对比，请以本机历史自我对照。"
        history={history}
        unitLabel="%"
      />
    </div>
  );
}
