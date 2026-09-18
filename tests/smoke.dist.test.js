import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 构建产物冒烟测试：在 `npm run build` 之后运行（CI 顺序 lint→check→test→build→smoke）。
 * 守护关键路由与主页跳转的 base 前缀（架构决策 #2，曾因 redirects 缺 base 踩坑）。
 */
const dist = join(import.meta.dirname, '../dist');
const distReady = existsSync(dist);

describe.skipIf(!distReady)('dist smoke', () => {
  it('主页跳转带 base 前缀', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf-8');
    expect(html).toContain('url=/earth-online-metadata/tools/');
  });

  it('关键路由页面均生成', () => {
    for (const page of [
      'tools/index.html',
      'tools/life-quest/index.html',
      'articles/index.html',
      'articles/site-relaunch/index.html',
      'articles/education-percentile/index.html',
      'articles/education-2030/index.html',
      'privacy/index.html',
      'terms/index.html',
    ]) {
      expect(existsSync(join(dist, page)), `缺少 ${page}`).toBe(true);
    }
  });

  it('文章引用的官方数据原文件随构建分发', () => {
    expect(existsSync(join(dist, 'data', 'census2020', 'A0401.xls'))).toBe(true);
  });

  it('页面内链接带 base 前缀（抽查工具页）', () => {
    const html = readFileSync(join(dist, 'tools/index.html'), 'utf-8');
    expect(html).toContain('/earth-online-metadata/articles/');
    expect(html).not.toMatch(/href="\/(tools|articles|privacy|terms)\//);
  });
});
