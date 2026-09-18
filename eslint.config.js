import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // 构建产物与生成目录不分析
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // React 岛屿：hooks 规则必须过（AI 生成 hooks 代码的高频错误点）
    files: ['src/**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Node 脚本（APK 汇率抓取，禁改区文件，仅补运行环境 globals）
    files: ['update_ledger_rates.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
