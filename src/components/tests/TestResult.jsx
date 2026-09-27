import { percentileLabel } from '../../lib/testutils.js';

/**
 * 测试结果卡 + 历史列表（属性检定三测试共用）。
 * 数据红线：normNote 必须明示参考分布来源与非临床局限。
 */
export default function TestResult({ value, unit, extra, percentile, normNote, history, unitLabel }) {
  return (
    <>
      {value !== null && (
        <div className="ts-result">
          <p className="ts-result-label">本次结果</p>
          <p className="ts-value">
            {value}
            {unit && <span className="ts-unit">{unit}</span>}
          </p>
          {extra && <p className="ts-extra">{extra}</p>}
          <div className="ts-bar" role="img" aria-label={percentileLabel(percentile)}>
            <div className="ts-bar-fill" style={{ width: `${percentile}%` }}></div>
          </div>
          <p className="ts-percentile">{percentileLabel(percentile)} · 高于参考人群中 {percentile}% 的人</p>
          <p className="ts-norm">{normNote}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="ts-history">
          <p className="ts-history-label">本机历史（最近 {Math.min(history.length, 10)} 次）</p>
          <ul className="ts-history-list">
            {history.slice(-10).reverse().map((h, i) => (
              <li key={i}>
                <span>{h.date}</span>
                <strong>{h.score}{unitLabel && ` ${unitLabel}`}</strong>
                <span>{percentileLabel(h.percentile)}</span>
              </li>
            ))}
          </ul>
          <p className="ts-norm">仅保存在本机浏览器（localStorage），不上传任何数据。</p>
        </div>
      )}
    </>
  );
}
