# Earth Online 服务端开发注意事项

## 原则

- 根目录的 assets 目录给 README.md 使用，用于给看仓库的人提供图片演示，不要和 web 网站的 assets 混淆。
- 和汇率相关代码及文件不要碰，这是 apk 的接口，不是 server 的 web 服务，所以在改 web 的时候不要误改 apk 接口。

