import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory } from '../../lib/testutils.js';

/**
 * 空间记忆（Corsi block-tapping）：3×3 网格中色块按随机位置序列闪现，
 * 用户按相同顺序点击复现。每级 2 次机会，对 1 次进位，连错 2 次结束。
 * 指标 = 最大空间广度（Corsi span，正常成人约 5-6）。
 */
const SIZE = 9; // 3×3
const SHOW_MS = 600;
const GAP_MS = 150;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const randomIdx = (n) => Math.floor(Math.random() * n);

/** 空间广度分档百分位——基于 Corsi 经典研究的粗略分档，非临床常模 */
export const SPAN_PERCENTILE = { 2: 3, 3: 12, 4: 32, 5: 58, 6: 80, 7: 93, 8: 98 };
export function spanPercentile(span) {
  return SPAN_PERCENTILE[Math.min(span, 8)] ?? 50;
}

function makeSequence(len) {
  const pool = Array.from({ length: SIZE }, (_, i) => i);
  const seq = [];
  for (let i = 0; i < len; i++) {
    const j = randomIdx(pool.length);
    seq.push(pool.splice(j, 1)[0]);
  }
  return seq;
}

export default function SpatialMemoryTest() {
  const [phase, setPhase] = useState('idle'); // idle | showing | recall | done
  const [span, setSpan] = useState(3);
  const [trial, setTrial] = useState(1);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [picked, setPicked] = useState([]); // 用户已点序列
  const [best, setBest] = useState(0);
  const [history, setHistory] = useState([]);
  const seqRef = useRef([]);
  const timersRef = useRef([]);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('spatial-memory')), []);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const showSequence = (len) => {
    seqRef.current = makeSequence(len);
    setPicked([]);
    setPhase('showing');
    seqRef.current.forEach((cell, i) => {
      timersRef.current.push(setTimeout(() => setFlashIdx(cell), i * (SHOW_MS + GAP_MS)));
      timersRef.current.push(setTimeout(() => setFlashIdx(-1), i * (SHOW_MS + GAP_MS) + SHOW_MS));
    });
    timersRef.current.push(setTimeout(() => {
      setFlashIdx(-1);
      setPhase('recall');
    }, len * (SHOW_MS + GAP_MS)));
  };

  const begin = () => { setSpan(3); setTrial(1); setBest(0); showSequence(3); };

  const start = () => { if (phase === 'idle' || phase === 'done') begin(); };

  const pickCell = (cell) => {
    if (phase !== 'recall' || picked.includes(cell)) return;
    const next = [...picked, cell];
    setPicked(next);
    const correct = next.every((c, i) => c === seqRef.current[i]);
    if (next.length < seqRef.current.length) {
      if (!correct) {
        // 顺序已错，直接判本轮失败
        judge(false);
      }
      return;
    }
    judge(correct);
  };

  const judge = (pass) => {
    if (pass) {
      setBest(span);
      setTrial(1);
      setSpan(span + 1);
      timersRef.current.push(setTimeout(() => showSequence(span + 1), 700));
    } else if (trial === 1) {
      setTrial(2);
      timersRef.current.push(setTimeout(() => showSequence(span), 700));
    } else {
      setHistory(appendHistory('spatial-memory', { score: best, percentile: spanPercentile(best) }));
      setPhase('done');
    }
  };

  const p = spanPercentile(best);

  return (
    <div className="sm">
      <div className="sm-status" aria-live="polite">
        {phase === 'idle' && '色块按顺序闪现 · 记住位置和顺序后点击复现'}
        {phase === 'showing' && `记住闪现顺序（${span} 个）…`}
        {phase === 'recall' && `按相同顺序点击 · 第 ${trial}/2 次机会`}
        {phase === 'done' && '完成！点击网格再测一次'}
      </div>

      <div className="sm-grid" onClick={start}>
        {Array.from({ length: SIZE }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`sm-cell ${flashIdx === i ? 'is-flash' : ''} ${picked.includes(i) ? 'is-picked' : ''}`}
            onClick={(e) => { e.stopPropagation(); pickCell(i); }}
            disabled={phase !== 'recall'}
            aria-label={`格子 ${i + 1}`}
          >
            {picked.includes(i) ? picked.indexOf(i) + 1 : ''}
          </button>
        ))}
      </div>

      {best > 0 && phase !== 'done' && <p className="ds-progress">当前已通过 {best} 位 · 正在测试 {span} 位（第 {trial}/2 次）</p>}

      <TestResult
        value={phase === 'done' ? best : null}
        unit=" 位"
        extra="最大空间广度（能按序复现的最长序列）"
        percentile={phase === 'done' ? p : null}
        normNote="分档参考：基于 Corsi 经典研究的粗略分档（正常成人空间广度约 5-6），非临床常模，仅供粗略对照。"
        history={history}
        unitLabel="位"
      />
    </div>
  );
}
