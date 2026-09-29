// Draft 功能可见性开关（决策 #18）
//
// 未完成的功能在注册表条目加 `draft: true`：本地 dev 服务器照常显示可测，
// 生产构建（astro build，含线上 main 部署）自动从注册表过滤掉、详情页重定向回板块首页。
// 功能完成后删掉 draft 行再 release 即对用户开放。
//
// 注意：draft 判断只存在于本文件与两个注册表导出处，组件不要散落 draft 逻辑。

/** 本地开发服务器（astro dev / vitest）可见 draft，生产构建不可见 */
export const draftsVisible = import.meta.env?.DEV === true;

/** 过滤注册表：生产环境剔除 draft 条目（导出处调用，消费方无感） @template T @param {T[]} list @returns {T[]} */
export function published(list) {
  return draftsVisible ? list : list.filter((it) => !it.draft);
}

/** 详情页守卫：生产注册表中查无此 slug（已被 draft 过滤）则视为未开放 @template T @param {T[]} registry @param {string} slug @returns {boolean} */
export function isLive(registry, slug) {
  return registry.some((it) => it.slug === slug);
}
