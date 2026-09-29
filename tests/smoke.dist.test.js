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
  it('主页生成且链接带 base 前缀（决策 #17 修订八：开机画面 + 版本公告）', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf-8');
    expect(html).not.toContain('http-equiv="refresh"');
    expect(html).toContain('EARTH ONLINE');
    expect(html).toContain('/earth-online-metadata/privacy/');
  });

  it('关键路由页面均生成', () => {
    for (const page of [
      'tools/index.html',
      'tools/life-quest/index.html',
      'tools/career-earnings/index.html',
      'tests/index.html',
      'tests/reaction-time/index.html',
      'tests/choice-reaction/index.html',
      'tests/digit-span/index.html',
      'tests/auditory-reaction/index.html',
      'tests/stroop/index.html',
      'tests/visual-search/index.html',
      'tests/time-perception/index.html',
      'tests/mental-rotation/index.html',
      'tests/n-back/index.html',
      'tests/number-series/index.html',
      'tests/risk-preference/index.html',
      'tests/task-switching/index.html',
      'tests/spatial-memory/index.html',
      'tests/delay-gratification/index.html',
      'tests/aim-trainer/index.html',
      'tests/mental-math/index.html',
      'tests/color-vision/index.html',
      'articles/index.html',
      'articles/education-percentile/index.html',
      'privacy/index.html',
      'terms/index.html',
    ]) {
      expect(existsSync(join(dist, page)), `缺少 ${page}`).toBe(true);
    }
  });

  it('文章引用的官方数据原文件随构建分发', () => {
    expect(existsSync(join(dist, 'data', 'census2020', 'A0401.xls'))).toBe(true);
  });

  it('未发布板块：列表页重定向回主页（决策 #18 修订一 releasedAreas）', () => {
    for (const page of ['tools/index.html', 'tests/index.html', 'articles/index.html']) {
      const html = readFileSync(join(dist, page), 'utf-8');
      expect(html, `${page} 应为重定向页`).toContain('http-equiv="refresh"');
      expect(html, `${page} 应重定向到主页`).toContain('/earth-online-metadata/');
    }
  });

  it('页面内链接带 base 前缀（抽查隐私页）', () => {
    const html = readFileSync(join(dist, 'privacy/index.html'), 'utf-8');
    expect(html).toContain('/earth-online-metadata/terms/');
    expect(html).not.toMatch(/href="\/(tools|articles|privacy|terms)\//);
  });
});
