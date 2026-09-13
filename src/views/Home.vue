<script setup>
// 主页：品牌首屏 + 特色面板，M3 亮色风格（图标用 Material Symbols）
const features = [
  { icon: 'sports_esports', title: '游戏化人生属性面板', desc: '将日常习惯打卡、待办清单和理财账单完全量化为角色经验值（EXP）与金币，看着自己在现实生活中一步步“打怪升级”！' },
  { icon: 'lock', title: '绝对零云端隐私保障', desc: '软件不设任何后台云端数据库，完全单机物理脱网运行。所有记账账单与私人成长日记仅物理留存在您设备中。' },
  { icon: 'trending_up', title: '高精度汇率定点数计算', desc: '内置高精度定点数账本换算，每日与欧洲央行（ECB）公开汇率同步，本地无感实现多币种资产计算，杜绝插屏广告。' },
  { icon: 'save', title: '自主备份与灵活导出', desc: '拒绝被软件绑定！支持一键生成本地备份压缩包，可完全自主地上传至您信任的私人网盘或物理介质。' },
]
</script>

<template>
  <div>
    <section class="hero">
      <div class="hero-logo"><span class="mi">public</span></div>
      <h1 class="hero-title">
        掌控人生属性<br />
        <span class="gradient-text">像玩游戏一样</span>记录成长
      </h1>
      <p class="hero-desc">
        人生面板（Earth Online）是一款全本地化运行的个人效率、记账与人生属性面板管理工具。
        我们坚持「零隐私收集」原则，让您的所有记录物理存留于本地。
      </p>
      <div class="hero-actions">
        <a class="app-btn" href="#download" @click.prevent="alert('APK 下载即将开放，敬请期待')">直接下载 APK</a>
        <RouterLink class="app-btn secondary" to="/tools">在线工具</RouterLink>
      </div>
    </section>

    <section class="feature-grid">
      <div v-for="f in features" :key="f.title" class="app-card feature-card">
        <div class="feature-icon"><span class="mi">{{ f.icon }}</span></div>
        <div class="feature-body">
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero { text-align: center; padding: 72px 0 40px; }
.hero-logo {
  width: 96px; height: 96px; border-radius: 28px;
  background: var(--primary-container); color: var(--on-primary-container);
  display: flex; align-items: center; justify-content: center;
  font-size: 46px; margin: 0 auto 28px;
}
.hero-title { font-size: 44px; line-height: 1.2; font-weight: 800; font-family: var(--font-title); margin-bottom: 20px; }
.gradient-text {
  background: linear-gradient(135deg, var(--primary), #00b0ff);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-desc { font-size: 17px; color: var(--on-surface-variant); max-width: 620px; margin: 0 auto 32px; line-height: 1.7; }
.hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

.feature-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
  margin-top: 40px;
}
.feature-card { display: flex; gap: 18px; padding: 20px; }
.hero-logo .mi { font-size: 46px; }
.feature-icon .mi { font-size: 26px; }
.feature-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: var(--primary-container); color: var(--on-primary-container);
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.feature-body h3 { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.feature-body p { font-size: 14px; color: var(--on-surface-variant); line-height: 1.6; }

@media (max-width: 720px) {
  .hero { padding: 48px 0 24px; }
  .hero-title { font-size: 32px; }
  .hero-desc { font-size: 15px; }
  .feature-grid { grid-template-columns: 1fr; gap: 14px; }
}
</style>
