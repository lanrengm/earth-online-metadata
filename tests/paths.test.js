import { describe, expect, it, vi } from 'vitest';

/**
 * withBase 单测：gh-pages 子路径链接前缀（架构决策 #3）
 * 通过 stub import.meta.env.BASE_URL 覆盖两种部署形态。
 */
describe('withBase', () => {
  it('base 为根路径时原样返回', async () => {
    vi.stubEnv('BASE_URL', '/');
    const { withBase } = await import('../src/lib/paths.js');
    expect(withBase('/tools/')).toBe('/tools/');
    expect(withBase('/articles/')).toBe('/articles/');
  });

  it('base 为 gh-pages 子路径时追加前缀（去尾斜杠拼接）', async () => {
    vi.stubEnv('BASE_URL', '/earth-online-metadata/');
    vi.resetModules();
    const { withBase } = await import('../src/lib/paths.js');
    expect(withBase('/tools/')).toBe('/earth-online-metadata/tools/');
    expect(withBase('/privacy/')).toBe('/earth-online-metadata/privacy/');
  });
});
