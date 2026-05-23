/**
 * ==========================================================================
 * 🌐 EARTH ONLINE - DYNAMIC LANGUAGE & UI SYSTEM (app.js)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化多语言系统
    initLanguageSystem();
});

/**
 * 初始化多语言切换逻辑
 */
function initLanguageSystem() {
    // 默认优先读取 localStorage，其次读取系统语言，兜底为英文
    let currentLang = localStorage.getItem('earth_online_lang');
    
    if (!currentLang) {
        const sysLang = navigator.language || navigator.userLanguage;
        currentLang = (sysLang && sysLang.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
    }

    // 设置初始语言
    setLanguage(currentLang);

    // 为所有的中英文切换按钮绑定事件
    const btnZh = document.querySelector('.lang-btn-zh');
    const btnEn = document.querySelector('.lang-btn-en');

    if (btnZh && btnEn) {
        btnZh.addEventListener('click', () => {
            setLanguage('zh');
        });

        btnEn.addEventListener('click', () => {
            setLanguage('en');
        });
    }
}

/**
 * 切换页面语言的基座函数
 * @param {'zh'|'en'} lang 
 */
function setLanguage(lang) {
    if (lang === 'zh') {
        document.body.classList.remove('lang-en');
        document.body.classList.add('lang-zh');
        document.documentElement.setAttribute('lang', 'zh');
    } else {
        document.body.classList.remove('lang-zh');
        document.body.classList.add('lang-en');
        document.documentElement.setAttribute('lang', 'en');
    }
    
    // 持久化存储用户选择
    localStorage.setItem('earth_online_lang', lang);
}
