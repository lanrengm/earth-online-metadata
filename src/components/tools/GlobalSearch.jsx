import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 顶栏全局搜索（对标 it-tools）：
 * - Ctrl/Cmd+K 全局聚焦；工具首页输入实时过滤卡片网格（CustomEvent 联动 ToolGrid）
 * - 其他页面输入弹出下拉结果，回车/点击直达工具详情页
 *
 * @param {{ tools: Array<{slug:string,title:string,desc:string,icon?:string,tags?:string[]}>, base?: string, onHome?: boolean }} props
 */
export default function GlobalSearch({ tools = [], base = '', onHome = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const kw = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!kw) return tools;
    return tools.filter((t) =>
      `${t.title}${t.desc}${(t.tags || []).join('')}`.toLowerCase().includes(kw),
    );
  }, [kw, tools]);
  const activeClamped = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const w = /** @type {any} */ (window);
    w.__eoToolSearch = kw;
    window.dispatchEvent(new CustomEvent('eo:tool-search', { detail: kw }));
  }, [kw]);

  const go = (slug) => {
    window.location.href = `${base}/tools/${slug}/`;
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (!onHome && results[activeClamped]) go(results[activeClamped].slug);
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else {
        inputRef.current?.blur();
        setOpen(false);
      }
    }
  };

  const showPanel = open && !onHome && kw.length > 0;

  return (
    <div className="gs">
      <span className="mi gs-icon" aria-hidden="true">search</span>
      <input
        ref={inputRef}
        className="gs-input"
        type="search"
        placeholder="搜索工具…"
        value={query}
        aria-label="搜索工具"
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <kbd className="gs-kbd">Ctrl K</kbd>

      {showPanel && (
        <div className="gs-panel" role="listbox">
          {results.length === 0 ? (
            <div className="gs-empty">没有匹配「{query}」的工具</div>
          ) : (
            results.map((t, i) => (
              <button
                key={t.slug}
                type="button"
                className={i === activeClamped ? 'gs-item is-active' : 'gs-item'}
                role="option"
                aria-selected={i === activeClamped}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(t.slug);
                }}
              >
                {t.icon && (
                  <span className="gs-item-icon">
                    <span className="mi">{t.icon}</span>
                  </span>
                )}
                <span className="gs-item-text">
                  <strong>{t.title}</strong>
                  <small>{t.desc}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
