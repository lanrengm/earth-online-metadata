import { useState } from 'react';

/**
 * 工具卡片类型（与 src/tools/registry.js 的条目一致）
 *
 * @typedef {Object} Tool
 * @property {string} slug   工具路径（/tools/<slug>/）
 * @property {string} title  名称
 * @property {string} desc   一句话描述
 * @property {string} [icon] Material Symbols 图标名
 * @property {string[]} [tags] 搜索标签
 */

/**
 * 工具网格（对齐 it-tools 首屏：大搜索框 + 分类网格卡片）
 * tools 为空注册表时显示空状态，首个工具上架后搜索与卡片自动生效。
 *
 * @param {{ tools?: Tool[], base?: string }} props
 */
export default function ToolGrid({ tools = [], base = '' }) {
  const [query, setQuery] = useState('');

  const kw = query.trim().toLowerCase();
  const filtered = kw
    ? tools.filter((t) => `${t.title}${t.desc}${(t.tags || []).join('')}`.toLowerCase().includes(kw))
    : tools;

  return (
    <div className="tool-area">
      <input
        className="tool-search"
        type="search"
        placeholder="搜索工具…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="搜索工具"
      />

      {tools.length === 0 ? (
        <p className="tool-empty">工具陆续上架中，敬请期待。</p>
      ) : filtered.length === 0 ? (
        <p className="tool-empty">没有匹配「{query}」的工具。</p>
      ) : (
        <div className="tool-grid">
          {filtered.map((t) => (
            <a key={t.slug} className="app-card tool-card" href={`${base}/tools/${t.slug}/`}>
              {t.icon && (
                <div className="tool-icon">
                  <span className="mi">{t.icon}</span>
                </div>
              )}
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
