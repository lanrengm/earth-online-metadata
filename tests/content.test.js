import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 文章管线守卫测试：frontmatter 必填字段与日期格式（schema 详见 src/content.config.ts）。
 * zod 在构建期兜底，本测试提供更快的反馈回路。
 */
const articlesDir = join(import.meta.dirname, '../src/content/articles');
const files = readdirSync(articlesDir).filter((f) => f.endsWith('.mdx'));

describe('articles frontmatter', () => {
  it('目录中存在 .mdx 文件', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} 的 frontmatter 完整`, () => {
      const raw = readFileSync(join(articlesDir, file), 'utf-8');
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      expect(fm, '缺少 frontmatter 块').toBeTruthy();

      const body = fm[1];
      expect(body).toMatch(/^title:\s*\S/m);
      expect(body).toMatch(/^description:\s*\S/m);
      expect(body).toMatch(/^date:\s*\d{4}-\d{2}-\d{2}/m);
      const title = body.match(/^title:\s*(.+)$/m)[1].trim();
      const dup = files.filter((f) => {
        const r = readFileSync(join(articlesDir, f), 'utf-8').match(/^title:\s*(.+)$/m);
        return r && r[1].trim() === title;
      });
      expect(dup.length, `title 重复：${dup.join(', ')}`).toBe(1);
    });
  }
});
