import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 顶栏全局搜索（决策 #17 修订四：降级为紧凑触发器）：
 * - 默认渲染「🔍 Ctrl K」触发按钮；点击或 Ctrl/Cmd+K 展开搜索面板（列出全部工具可浏览）
 * - 工具首页输入实时过滤卡片网格（CustomEvent 联动 ToolGrid），面板隐藏
 * - 其他页面弹出结果面板，回车/点击直达工具详情页
 *
 * @param {{ tools: Array<{slug:string,title:string,desc:string,icon?:string,tags?:string[]}>, base?: string, onHome?: boolean }} props
 */
export default function GlobalSearch({ tools = [], base = '', onHome = false }) {
  const [query, setQuery] = useState('');
  const [palette, setPalette] = useState(false); // 触发器展开（输入模式）
  const [open, setOpen] = useState(false); // 下拉结果面板
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
        setPalette(true);
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // 展开时聚焦输入框（触发器 → 输入框替换渲染后生效）
  useEffect(() => {
    if (palette) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [palette]);

  useEffect(() => {
    const w = /** @type {any} */ (window);
    w.__eoToolSearch = kw;
    window.dispatchEvent(new CustomEvent('eo:tool-search', { detail: kw }));
  }, [kw]);

  const go = (slug) => {
    window.location.href = `${base}/tools/${slug}/`;
  };

  const closePalette = () => {
    setOpen(false);
    setPalette(false);
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
        closePalette();
      }
    }
  };

  // 非工具首页：面板展开即列出全部工具（可浏览），有关键词时过滤
  const showPanel = palette && open && !onHome;

  if (!palette) {
    return (
      <div className="gs">
        <button
          type="button"
          className="gs-trigger"
          aria-label="搜索工具（Ctrl+K）"
          onClick={() => {
            setPalette(true);
            setOpen(true);
          }}
        >
          <span className="mi" aria-hidden="true">search</span>
          <kbd className="gs-kbd">Ctrl K</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="gs">
      <span className="mi gs-icon" aria-hidden="true">search</span>
      <input
        ref={inputRef}
        className="gs-input"
        type="search"
        placeholder={onHome ? '筛选工具…' : '搜索工具…'}
        value={query}
        aria-label="搜索工具"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); if (!query) setPalette(false); }, 120)}
        onKeyDown={onKeyDown}
      />

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
