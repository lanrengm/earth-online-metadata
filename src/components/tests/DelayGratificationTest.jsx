import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory } from '../../lib/testutils.js';

/**
 * 延迟满足（阶梯式）：「立即拿 10 积分」vs「等待 N 秒拿大积分」，N 与奖励逐轮递增。
 * 选择等待则真实等待（不可见倒计时，可放弃）；选立即或放弃即结束。
 * 指标 = 累计等待秒数（坚持轮数）。虚拟积分，无对错，实验性指标（决策 #16）。
 */
const SURE = 10; // 立即奖励
const LADDER = [
  { wait: 10, reward: 30 },
  { wait: 15, reward: 50 },
  { wait: 25, reward: 80 },
  { wait: 40, reward: 120 },
  { wait: 60, reward: 200 },
];

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const randomIdx = (n) => Math.floor(Math.random() * n);
const DOT_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export default function DelayGratificationTest() {
  const [phase, setPhase] = useState('idle'); // idle | choose | waiting | round | done
  const [idx, setIdx] = useState(0);
  const [earned, setEarned] = useState(0);
  const [waitedTotal, setWaitedTotal] = useState(0);
  const [dot, setDot] = useState(0);
  const [history, setHistory] = useState([]);
  const timersRef = useRef([]);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('delay-gratification')), []);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const cur = LADDER[Math.min(idx, LADDER.length - 1)];

  const begin = () => { setEarned(0); setWaitedTotal(0); setIdx(0); setPhase('choose'); };

  const start = () => { if (phase === 'idle' || phase === 'done') begin(); };

  const chooseNow = () => {
    if (phase !== 'choose') return;
    finishRun();
  };

  const chooseWait = () => {
    if (phase !== 'choose') return;
    setPhase('waiting');
    // 等待动画帧
    for (let t = 1; t * 200 < cur.wait * 1000; t++) {
      timersRef.current.push(setTimeout(() => setDot(t % DOT_FRAMES.length), t * 200));
    }
    timersRef.current.push(setTimeout(() => {
      setEarned((e) => e + cur.reward);
      setWaitedTotal((w) => w + cur.wait);
      setPhase('round');
      timersRef.current.push(setTimeout(() => {
        if (idx + 1 >= LADDER.length) {
          finishRun();
        } else {
          setIdx(idx + 1);
          setPhase('choose');
        }
      }, 1200));
    }, cur.wait * 1000));
  };

  const giveUp = () => {
    timersRef.current.forEach(clearTimeout);
    finishRun();
  };

  const finishRun = () => {
    setPhase('done');
    setHistory(appendHistory('delay-gratification', { score: waitedTotal, percentile: null, earned: earned }));
  };

  const finished = phase === 'done';

  return (
    <div className="dg">
      <div className="dg-status" aria-live="polite">
        {phase === 'idle' && '每轮二选一：立即拿小积分，或等待换大积分 · 共 5 轮'}
        {phase === 'choose' && `第 ${idx + 1}/${LADDER.length} 轮 · 已坚持等待 ${waitedTotal}s · 已赚 ${earned} 积分`}
        {phase === 'waiting' && `${DOT_FRAMES[dot]} 等待中…坚持住，别离开`}
        {phase === 'round' && `+${cur.reward} 积分！`}
        {finished && '本局结束 · 点击任意处重测'}
      </div>

      <div className="dg-stage" onClick={start}>
        {phase === 'idle' && <span className="dg-q">点击开始<br /><small>虚拟积分 · 全程约 2-3 分钟 · 中途放弃已得积分保留</small></span>}
        {phase === 'choose' && <span className="dg-q">第 {idx + 1} 轮<br /><small>本轮：立即拿 {SURE} 分，还是等 {cur.wait} 秒拿 {cur.reward} 分？</small></span>}
        {phase === 'waiting' && <span className="dg-q">{DOT_FRAMES[dot]}<br /><small>正在等待 {cur.wait} 秒换 {cur.reward} 积分…</small></span>}
        {phase === 'round' && <span className="dg-q dg-win">+{cur.reward} 积分<br /><small>下一轮奖励更大 · 点击继续</small></span>}
        {finished && <span className="dg-q">累计等待 {waitedTotal}s · 赚了 {earned} 积分<br /><small>点击重测</small></span>}
      </div>

      {phase === 'choose' && (
        <div className="rp-options">
          <button type="button" className="rp-opt" onClick={chooseNow}>
            <strong>立即拿 {SURE} 分</strong>
            <small>结束本局，保留已得积分</small>
          </button>
          <button type="button" className="rp-opt" onClick={chooseWait}>
            <strong>等 {cur.wait} 秒拿 {cur.reward} 分</strong>
            <small>等待期间不能跳过（可放弃）</small>
          </button>
        </div>
      )}
      {phase === 'waiting' && (
        <button type="button" className="dg-giveup" onClick={giveUp}>放弃等待并结束</button>
      )}

      <TestResult
        value={finished ? waitedTotal : null}
        unit=" s"
        extra={finished ? `累计等待 ${waitedTotal} 秒（坚持 ${waitedTotal ? LADDER.filter((l) => waitedTotal >= l.wait).length : 0}/${LADDER.length} 轮）· 赚 ${earned} 积分` : null}
        percentile={null}
        normNote="实验性指标：延迟满足无公开标准参考分布（虚拟积分情境与经典棉花糖实验不可比），不做百分位对比，请以本机历史自我对照。"
        history={history}
        unitLabel="s"
      />
    </div>
  );
}

// randomIdx 预留（等待动画帧使用固定序列，未来随机化用）
void randomIdx;
