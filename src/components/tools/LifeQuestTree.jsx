import { useMemo, useState } from 'react';

const STORAGE_KEY = 'eo_lifequest_v1';

/** tokens.css 分支令牌映射（健康系用品牌主色） */
const BRANCH_COLOR = {
  primary: 'var(--primary)',
  wealth: 'var(--branch-wealth)',
  emotion: 'var(--branch-emotion)',
};

function loadChecked() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

/**
 * 人生主线任务板（对标 distill 式交互：结构化数据 → 可勾选任务树）。
 * 纯本地运行：勾选状态存 localStorage，无账号无上传。
 */
export default function LifeQuestTree({ branches }) {
  const [checked, setChecked] = useState(loadChecked);

  const counts = useMemo(() => {
    const all = { done: 0, total: 0 };
    const byBranch = {};
    for (const b of branches) {
      let done = 0;
      let total = 0;
      for (const d of b.domains) {
        for (const t of d.tasks) {
          total += 1;
          if (checked[t.id]) done += 1;
        }
      }
      byBranch[b.id] = { done, total };
      all.done += done;
      all.total += total;
    }
    return { all, byBranch };
  }, [branches, checked]);

  function toggle(id) {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* 隐私模式等场景下静默降级为仅内存 */
      }
      return next;
    });
  }

  function reset() {
    if (!window.confirm('确定清空全部勾选进度吗？')) return;
    setChecked({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 同上 */
    }
  }

  return (
    <div className="lq">
      <header className="lq-board">
        <div className="lq-board-text">
          <span className="mi lq-board-icon" aria-hidden="true">map</span>
          <div>
            <h2>人生主线 · 主线任务板</h2>
            <p>点亮任务卡，推进你的三系人生进度</p>
          </div>
        </div>
        <div className="lq-board-progress">
          <span className="lq-board-count">
            {counts.all.done}/{counts.all.total}
          </span>
          <div className="lq-track lq-track-lg">
            <div
              className="lq-fill lq-fill-primary"
              style={{ width: `${(counts.all.done / counts.all.total) * 100}%` }}
            />
          </div>
        </div>
        <button type="button" className="lq-reset" onClick={reset}>重置</button>
      </header>

      {branches.map((b) => {
        const c = counts.byBranch[b.id];
        const color = BRANCH_COLOR[b.token] || 'var(--primary)';
        return (
          <section key={b.id} className="lq-branch" style={{ '--bcolor': color }}>
            <div className="lq-branch-head">
              <span className="mi" aria-hidden="true">{b.icon}</span>
              <h3>{b.name}</h3>
              <span className="lq-branch-count">{c.done}/{c.total}</span>
              <div className="lq-track">
                <div className="lq-fill" style={{ width: `${(c.done / c.total) * 100}%` }} />
              </div>
            </div>

            {b.domains.map((d) => (
              <div key={d.name} className="lq-domain">
                <p className="lq-domain-name">{d.name}</p>
                <div className="lq-tasks">
                  {d.tasks.map((t) => {
                    const done = Boolean(checked[t.id]);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        className={`lq-task${done ? ' is-done' : ''}`}
                        onClick={() => toggle(t.id)}
                      >
                        <span className="lq-check" aria-hidden="true">
                          <span className="mi">check</span>
                        </span>
                        <span className="lq-task-body">
                          <strong>{t.title}</strong>
                          <small>{t.desc}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
