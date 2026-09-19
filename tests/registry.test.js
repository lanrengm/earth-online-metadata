import { describe, expect, it } from 'vitest';
import { tools } from '../src/tools/registry.js';

/**
 * 工具注册表守卫测试：AI 在 registry.js 加条目写错字段时，测试先于构建报错。
 * （管线约定见 docs/架构决策.md #6）
 */
describe('tools registry', () => {
  it('slug 唯一且为 kebab-case', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('每个工具具备必填字段与类型', () => {
    for (const t of tools) {
      expect(t.title.trim().length).toBeGreaterThan(0);
      expect(t.desc.trim().length).toBeGreaterThan(0);
      expect(typeof t.icon === 'string' || t.icon === undefined).toBe(true);
      expect(Array.isArray(t.tags ?? [])).toBe(true);
      expect(t.category.trim().length).toBeGreaterThan(0);
    }
  });
});
