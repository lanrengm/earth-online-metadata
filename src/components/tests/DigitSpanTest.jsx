import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, digitSpanPercentile, loadHistory } from '../../lib/testutils.js';

/**
 * 数字广度（正向）：数字逐个闪现 → 按顺序输入。每个长度 2 次机会，对 1 次进位，连错 2 次结束。
 * 经典工作记忆容量指标（Miller 7±2）。
 */
const SHOW_MS = 900;
const GAP_MS = 250;

export default function DigitSpanTest() {
  const [phase, setPhase] = useState('idle'); // idle | showing | recall | done
  const [span, setSpan] = useState(3);
  const [trial, setTrial] = useState(1); // 每级第几次尝试（1/2）
  const [display, setDisplay] = useState('');
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'pass' | 'fail'
  const [best, setBest] = useState(0);
  const [history, setHistory] = useState([]);
  const timersRef = useRef([]);
  const seqRef = useRef('');

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('digit-span')), []);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const showSequence = (len) => {
    let seq = '';
    for (let i = 0; i < len; i++) seq += Math.floor(Math.random() * 10);
    seqRef.current = seq;
    setPhase('showing');
    setDisplay('');
    seq.split('').forEach((d, i) => {
      timersRef.current.push(setTimeout(() => setDisplay(d), i * (SHOW_MS + GAP_MS)));
    });
    timersRef.current.push(setTimeout(() => {
      setDisplay('');
      setInput('');
      setPhase('recall');
    }, seq.length * (SHOW_MS + GAP_MS)));
  };

  const begin = () => { setSpan(3); setTrial(1); setBest(0); showSequence(3); };

  const start = () => {
    if (phase === 'idle' || phase === 'done') begin();
  };

  const submit = (e) => {
    e.preventDefault();
    if (phase !== 'recall' || !input) return;
    const correct = input === seqRef.current;
    if (correct) {
      const newBest = span;
      setBest(newBest);
      setFeedback('pass');
      timersRef.current.push(setTimeout(() => {
        setFeedback(null);
        setTrial(1);
        setSpan(span + 1);
        showSequence(span + 1);
      }, 900));
    } else if (trial === 1) {
      setFeedback('fail');
      timersRef.current.push(setTimeout(() => {
        setFeedback(null);
        setTrial(2);
        showSequence(span);
      }, 900));
    } else {
      setFeedback('fail');
      const p = digitSpanPercentile(best);
      setHistory(appendHistory('digit-span', { score: best, percentile: p }));
      timersRef.current.push(setTimeout(() => {
        setFeedback(null);
        setPhase('done');
      }, 900));
    }
  };

  const p = digitSpanPercentile(best);

  return (
    <div className="ds">
      <button
        type="button"
        className={`ds-screen ${feedback === 'pass' ? 'is-pass' : feedback === 'fail' ? 'is-fail' : ''}`}
        onClick={start}
        disabled={phase === 'showing' || phase === 'recall'}
      >
        {phase === 'idle' && <span>点击开始<br /><small>数字逐个闪现，按原顺序输入 · 同长度可错 1 次</small></span>}
        {phase === 'showing' && <span className="ds-digit">{display || '…'}</span>}
        {phase === 'recall' && <span className="ds-recall">第 {trial}/2 次 · 输入 {span} 位数</span>}
        {phase === 'done' && <span>再测一次<br /><small>本局最大广度 {best} 位</small></span>}
        {feedback === 'pass' && phase !== 'showing' && <span className="ds-feedback">✓ 进位</span>}
        {feedback === 'fail' && phase !== 'showing' && <span className="ds-feedback">✗</span>}
      </button>

      {phase === 'recall' && (
        <form className="ds-form" onSubmit={submit}>
          <input
            className="ds-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
            aria-label="按顺序输入刚才的数字"
          />
          <button type="submit" className="ds-submit">提交</button>
        </form>
      )}

      {best > 0 && phase !== 'done' && <p className="ds-progress">当前已通过 {best} 位 · 正在测试 {span} 位（第 {trial}/2 次）</p>}

      <TestResult
        value={phase === 'done' ? best : null}
        unit=" 位"
        extra="正向数字广度（能完整复现的最大长度）"
        percentile={phase === 'done' ? p : 0}
        normNote="分档参考：基于经典工作记忆容量研究（Miller 7±2）与 WAIS 正向数字广度的粗略分档，非临床常模，仅供粗略对照。"
        history={history}
        unitLabel="位"
      />
    </div>
  );
}
