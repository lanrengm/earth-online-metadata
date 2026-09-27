import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory } from '../../lib/testutils.js';

/**
 * 2-back 工作记忆：字母逐个闪现，判断「当前字母是否与 2 步前相同」。
 * 20 个字母（前 2 个无法判断，可判 18 个），其中 6 个为 match。
 * 指标 = 准确率 (hits + correct rejections) / 18。
 * 实验性指标：无公开参考分布，结果与本机历史对照（决策 #16 数据红线）。
 */
const TOTAL = 20;
const STEP_MS = 2500; // 每字母展示时长
const LETTERS = 'BCDFHKLMPRTVW'.split('');
const MATCH_COUNT = 6;

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const randomIdx = (n) => Math.floor(Math.random() * n);

function makeSequence() {
  const seq = Array.from({ length: TOTAL }, () => LETTERS[randomIdx(LETTERS.length)]);
  // 强制位置 2..TOTAL-1 中恰好 MATCH_COUNT 个 match
  const idxs = Array.from({ length: TOTAL - 2 }, (_, i) => i + 2);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = randomIdx(i + 1);
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const matches = new Set(idxs.slice(0, MATCH_COUNT));
  for (let i = 2; i < TOTAL; i++) {
    if (matches.has(i)) {
      seq[i] = seq[i - 2];
    } else {
      while (seq[i] === seq[i - 2]) seq[i] = LETTERS[randomIdx(LETTERS.length)];
    }
  }
  return seq;
}

export default function NBackTest() {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [current, setCurrent] = useState('');
  const [pos, setPos] = useState(0);
  const [score, setScore] = useState(null); // {accuracy, hits, misses, falseAlarms}
  const [history, setHistory] = useState([]);
  const seqRef = useRef([]);
  const posRef = useRef(0);
  const clickedRef = useRef(false);
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
  const timersRef = useRef([]);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('n-back')), []);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const start = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    seqRef.current = makeSequence();
    posRef.current = 0;
    clickedRef.current = false;
    statsRef.current = { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
    setScore(null);
    setPhase('running');
    step();
  };

  const settle = (idx) => {
    if (idx < 2) return;
    const isMatch = seqRef.current[idx] === seqRef.current[idx - 2];
    const clicked = clickedRef.current;
    const s = statsRef.current;
    if (isMatch && clicked) s.hits++;
    else if (isMatch && !clicked) s.misses++;
    else if (!isMatch && clicked) s.falseAlarms++;
    else s.correctRejections++;
  };

  const step = () => {
    const idx = posRef.current;
    if (idx >= TOTAL) {
      finish();
      return;
    }
    if (idx > 0) settle(idx - 1); // 结算上一个字母的判断窗口
    clickedRef.current = false;
    posRef.current = idx + 1;
    setPos(idx);
    setCurrent(seqRef.current[idx]);
    timersRef.current.push(setTimeout(step, STEP_MS));
  };

  const finish = () => {
    const s = statsRef.current;
    const accuracy = Math.round(((s.hits + s.correctRejections) / (TOTAL - 2)) * 100);
    const entry = { score: accuracy, percentile: null, hits: s.hits, misses: s.misses, falseAlarms: s.falseAlarms };
    setHistory(appendHistory('n-back', entry));
    setScore({ accuracy, ...s });
    setPhase('done');
  };

  const pressMatch = () => {
    if (phase !== 'running' || posRef.current < 3) return; // 前 2 个无判断对象（窗口未开）
    clickedRef.current = true;
  };

  return (
    <div className="nb">
      <div className="nb-status" aria-live="polite">
        {phase === 'idle' && '字母逐个闪现 · 当前字母与 2 步前相同时点「相同」'}
        {phase === 'running' && `第 ${pos + 1}/${TOTAL} 个 · 判断：与 2 步前相同？`}
        {phase === 'done' && '完成！点击屏幕再测一次'}
      </div>

      <button type="button" className={`nb-screen ${phase === 'done' ? 'is-done' : ''}`} onClick={() => { if (phase === 'idle' || phase === 'done') start(); }} disabled={phase === 'running'}>
        {phase === 'idle' && <span>点击开始<br /><small>2-back · 20 个字母 · 6 个与 2 步前相同</small></span>}
        {phase === 'running' && <span className="nb-letter">{current}</span>}
        {phase === 'done' && score && (
          <span>准确率 {score.accuracy}%<br /><small>命中 {score.hits} · 漏报 {score.misses} · 误报 {score.falseAlarms}</small></span>
        )}
      </button>

      <button type="button" className="nb-hit app-btn" onClick={pressMatch} disabled={phase !== 'running'}>
        与 2 步前相同
      </button>

      <TestResult
        value={phase === 'done' && score ? score.accuracy : null}
        unit=" %"
        extra={score ? `命中 ${score.hits} · 漏报 ${score.misses} · 误报 ${score.falseAlarms} · 正确拒绝 ${score.correctRejections}` : null}
        percentile={null}
        normNote="实验性指标：2-back 准确率无公开标准参考分布，不做百分位对比，请以本机历史自我对照。参数固定：20 字母、6 个 match、每字 2.5 秒。"
        history={history}
        unitLabel="%"
      />
    </div>
  );
}
