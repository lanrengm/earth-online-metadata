/**
 * 图标字体子集获取脚本（方案 A：自托管 Material Symbols Rounded）
 *
 * 用法：node scripts/fetch-icon-font.mjs
 * 原理：调用 Google Fonts css2 API 的 icon_names 参数生成官方子集（woff2，几十 KB），
 *       下载到 src/styles/fonts/ 自托管，摆脱对 fonts.googleapis.com 的运行时依赖。
 * 加新图标：把图标名追加到下面的 ICON_NAMES 列表，重跑本脚本即可。
 * 授权：Material Symbols 以 Apache 2.0 发布（见同目录 LICENSE.txt），允许自托管与子集化。
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = join(root, 'src/styles/fonts');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// 当前在用 + 高频候选（覆盖工具注册表/导航/文章的常见场景）
const ICON_NAMES = [
  // 在用
  'widgets', 'article', 'light_mode', 'dark_mode', 'account_tree',
  'favorite', 'payments', 'diversity_1', 'map', 'check', 'warning',
  // 通用 UI 候选
  'home', 'menu', 'search', 'close', 'add', 'edit', 'delete', 'refresh',
  'settings', 'info', 'copy', 'link', 'star', 'schedule', 'download',
  'trending_up', 'trending_down', 'arrow_back', 'arrow_forward', 'chevron_right',
  'chevron_left', 'open_in_new', 'save', 'share', 'visibility', 'filter_alt',
  // 领域候选（人生主线/未来工具）
  'fitness_center', 'restaurant', 'self_improvement', 'psychology', 'work',
  'business_center', 'savings', 'account_balance', 'health_and_safety',
  'sports_esports', 'lock', 'school', 'group', 'flag', 'timeline',
];

const api = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block&icon_names=${ICON_NAMES.join(',')}`;

const css = await (await fetch(api, { headers: { 'User-Agent': UA } })).text();
const match = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)\s*format\('woff2'\)/);
if (!match) throw new Error('未在 css2 响应中找到 woff2 地址：\n' + css.slice(0, 500));
const buf = Buffer.from(await (await fetch(match[1])).arrayBuffer());
writeFileSync(join(FONTS_DIR, 'material-symbols-rounded.subset.woff2'), buf);
console.log(`✓ 字体子集已更新：${(buf.length / 1024).toFixed(0)} KB，包含 ${ICON_NAMES.length} 个图标`);

const license = await (
  await fetch('https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE')
).text();
writeFileSync(join(FONTS_DIR, 'LICENSE.txt'), license + '\n\n NOTE: This file is a subset of Material Symbols Rounded generated via Google Fonts css2 API (icon_names parameter). Subsetted by Earth Online web project.\n');
console.log('✓ Apache 2.0 LICENSE 已更新');
