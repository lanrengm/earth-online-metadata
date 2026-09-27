import { useEffect, useRef, useState } from 'react';
import TestResult from './TestResult.jsx';
import { appendHistory, loadHistory, median } from '../../lib/testutils.js';

/**
 * 任务切换（cued switching）：显示「数字+字母」对，顶部提示当前规则——
 * 按奇偶（数字规则）或按元音/辅音（字母规则）选左/右分类。
 * 规则序列随机（切换/重复约各半），主指标 = 切换成本：切换轮中位 − 重复轮中位。
 * 实验性指标：无公开参考分布（决策 #16）。
 */
const ROUNDS = 16;
const DIGITS = [2, 3, 4, 6, 7, 8, 9];
const VOWELS = 'AEIOU'.split('');
const CONSONANTS = 'BCDFGHKLMNPRSTW'.split('');

// 模块级封装：impure 调用仅发生在事件处理器/定时器回调内，与 render 无关（react-hooks/purity）
const monotonicNow = () => performance.now();
const randomIdx = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[randomIdx(arr.length)];

/** 生成规则序列：切换次数落在 [7,9]，否则重摇 */
function makeRules() {
  for (;;) {
    const rules = Array.from({ length: ROUNDS }, () => (randomIdx(2) === 0 ? 'parity' : 'vowel'));
    const switches = rules.filter((r, i) => i > 0 && r !== rules[i - 1]).length;
    if (switches >= 7 && switches <= 9) return rules;
  }
}

function makeTrials() {
  const rules = makeRules();
  return rules.map((rule, i) => ({
    rule,
    switched: i > 0 && rule !== rules[i - 1],
    digit: pick(DIGITS),
    letter: pick(randomIdx(2) === 0 ? VOWELS : CONSONANTS),
  }));
}

export default function TaskSwitchingTest() {
  const [phase, setPhase] = useState('idle'); // idle | go | done
  const [idx, setIdx] = useState(0);
  const [trials, setTrials] = useState([]);
  const [rtsRepeat, setRtsRepeat] = useState([]);
  const [rtsSwitch, setRtsSwitch] = useState([]);
  const [errors, setErrors] = useState(0);
  const [history, setHistory] = useState([]);
  const goAtRef = useRef(0);

  // 挂载后从 localStorage 载入本机历史（外部系统，非 render 派生）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHistory(loadHistory('task-switching')), []);

  const cur = trials[Math.min(idx, trials.length - 1)];
  const rule = cur ? cur.rule : 'parity';
  const isVowelRule = rule === 'vowel';
  const leftLabel = isVowelRule ? '辅音' : '偶数';
  const rightLabel = isVowelRule ? '元音' : '奇数';

  const begin = () => {
    setTrials(makeTrials());
    setIdx(0);
    setRtsRepeat([]);
    setRtsSwitch([]);
    setErrors(0);
    goAtRef.current = monotonicNow();
    setPhase('go');
  };

  const answer = (side) => {
    if (phase === 'idle' || phase === 'done') { begin(); return; }
    if (phase !== 'go') return;
    let correctSide;
    if (rule === 'parity') correctSide = cur.digit % 2 === 1 ? 'right' : 'left';
    else correctSide = 'AEIOU'.includes(cur.letter) ? 'right' : 'left';
    if (side !== correctSide) {
      setErrors((e) => e + 1);
      goAtRef.current = monotonicNow(); // 答错重计本轮
      return;
    }
    const rt = Math.round(monotonicNow() - goAtRef.current);
    if (cur.switched) setRtsSwitch((r) => [...r, rt]);
    else setRtsRepeat((r) => [...r, rt]);
    if (rtsRepeat.length + rtsSwitch.length + 1 >= ROUNDS) {
      setPhase('done');
      const medS = median([...rtsSwitch, rt]);
      const medR = median([...rtsRepeat, rt]);
      const main = medS && medR ? medS - medR : 0;
      setHistory(appendHistory('task-switching', { score: main, percentile: null, medianRt: median([...rtsRepeat, ...rtsSwitch, rt]), errors: errors }));
    } else {
      setIdx(idx + 1);
      goAtRef.current = monotonicNow();
    }
  };

  const finished = phase === 'done';
  const medS = rtsSwitch.length ? median(rtsSwitch) : 0;
  const medR = rtsRepeat.length ? median(rtsRepeat) : 0;
  const main = finished && medS && medR ? medS - medR : 0;
  const totalValid = rtsRepeat.length + rtsSwitch.length;

  return (
    <div className="ts2">
      <div className="ts2-status" aria-live="polite">
        {phase === 'idle' && '按提示规则分类中间的组合 · 规则会随机切换'}
        {phase === 'go' && `规则：${isVowelRule ? '字母——元音还是辅音' : '数字——奇数还是偶数'}${cur.switched ? '（已切换）' : ''}`}
        {finished && '完成！点击任意处再测一次'}
      </div>

      <div className="ts2-stage" onClick={() => { if (finished) begin(); }}>
        {phase === 'idle' && <span className="ts2-stim">点击开始</span>}
        {phase === 'go' && <span className="ts2-stim">{cur.digit}<small>{cur.letter}</small></span>}
        {finished && <span className="ts2-stim">切换成本 {main} ms<br /><small>点击再测</small></span>}
      </div>

      {phase === 'go' && (
        <div className="ts2-buttons">
          <button type="button" className="app-btn secondary" onClick={() => answer('left')}>{leftLabel}</button>
          <button type="button" className="app-btn" onClick={() => answer('right')}>{rightLabel}</button>
        </div>
      )}

      {totalValid > 0 && !finished && <p className="st-rounds">有效 {totalValid}/{ROUNDS} 轮 · 误答 {errors} 次</p>}

      <TestResult
        value={finished ? main : null}
        unit=" ms"
        extra={`切换轮 ${medS}ms − 重复轮 ${medR}ms = 切换成本 · 正确轮 ${totalValid} · 误答 ${errors}`}
        percentile={null}
        normNote="实验性指标：切换成本（切换轮−重复轮）无公开标准参考分布，不做百分位对比，请以本机历史自我对照。成本越大说明规则切换消耗越多。"
        history={history}
        unitLabel="ms"
      />
    </div>
  );
}
