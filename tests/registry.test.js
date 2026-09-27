import { describe, expect, it } from 'vitest';
import { tools } from '../src/tools/registry.js';
import { tests } from '../src/tests/registry.js';

/**
 * 注册表守卫测试：AI 在 registry 加条目写错字段时，测试先于构建报错。
 * （管线约定见 docs/架构决策.md #6）
 */
function checkRegistry(name, entries) {
  describe(name, () => {
    it('slug 唯一且为 kebab-case', () => {
      const slugs = entries.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) {
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    });

    it('每个条目具备必填字段与类型', () => {
      for (const t of entries) {
        expect(t.title.trim().length).toBeGreaterThan(0);
        expect(t.desc.trim().length).toBeGreaterThan(0);
        expect(typeof t.icon === 'string' || t.icon === undefined).toBe(true);
        expect(Array.isArray(t.tags ?? [])).toBe(true);
        if (t.category !== undefined) expect(t.category.trim().length).toBeGreaterThan(0);
      }
    });
  });
}

checkRegistry('tools registry', tools);
checkRegistry('tests registry', tests);
