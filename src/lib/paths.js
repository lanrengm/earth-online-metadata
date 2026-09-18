// GitHub Pages 项目站部署在子路径下，所有内部链接须经 withBase 加前缀
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** '/tools/' → '/earth-online-metadata/tools/'（base 为根时原样返回） */
export const withBase = (path) => `${BASE}${path}`;
