# Earth Online 服务端开发注意事项

## 原则

- 根目录的 assets 目录给 README.md 使用，用于给看仓库的人提供图片演示，不要和 web 网站的 assets 混淆。
- 和汇率相关代码及文件不要碰，这是 apk 的接口，不是 server 的 web 服务，所以在改 web 的时候不要误改 apk 接口。

## 汇率数据

欧洲央行（ECB）汇率，EUR 基准，由 GitHub Actions 每日 23:30 定时更新。
数据位于 `ledger/v1/exchange_rates.json`，仅供 APK 调用，勿改动。

## 仓库结构

```
├── .github/workflows/
│   ├── update_rates.yml   # 汇率定时更新（APK 接口）
│   └── deploy.yml         # 官网构建部署到 gh-pages
├── index.html             # Vite 入口
├── vite.config.js         # Vite 配置
├── package.json           # 依赖（vue / vue-router / vite / plugin-vue）
├── ledger/v1/exchange_rates.json  # 汇率数据（APK 接口）
├── update_ledger_rates.js         # 汇率抓取脚本
├── src/
│   ├── main.js            # 入口
│   ├── App.vue            # 外壳（导航 + 路由出口 + 页脚）
│   ├── router/index.js    # hash 路由 + 工具路由表
│   ├── theme.js           # 亮/暗/跟随系统主题
│   ├── styles/tokens.css  # M3 设计令牌
│   ├── views/
│   │   ├── Home.vue
│   │   ├── Privacy.vue
│   │   ├── Terms.vue
│   │   └── tools/index.vue
│   └── components/
│       ├── AppNav.vue
│       └── AppCard.vue
├── public/                # 静态资源（随构建进 dist）
├── assets/                # README 演示图（勿与 web 混淆）
└── README.md
```


