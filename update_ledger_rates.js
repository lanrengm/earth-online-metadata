const fs = require('fs');

async function updateRates() {
    try {
        // 1. 请求 Frankfurter API 最新汇率（基准为 EUR）
        const response = await fetch('https://api.frankfurter.dev/v1/latest');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // 2. 精选我们常用的 13 种兑 EUR 的货币代码
        const targetCurrencies = [
            'CNY', 'USD', 'HKD', 'JPY', 'GBP', 'AUD',
            'CAD', 'SGD', 'CHF', 'KRW', 'THB', 'NZD', 'MYR'
        ];

        const scaledRates = {};

        targetCurrencies.forEach(code => {
            if (data.rates[code]) {
                // 🌟 核心：将原始 double 汇率乘以 1,000,000，四舍五入为 6 位精度整数
                scaledRates[code] = Math.round(data.rates[code] * 1000000);
            }
        });

        // 3. 构建符合我们定义的 CurrencyRateEntity JSON 数据结构
        const output = {
            rates: scaledRates,
            date: data.date, // 欧洲央行官方发布日期
            cached_at: new Date().toISOString() // 云端抓取时间
        };

        // 4. 写入本地文件
        fs.mkdirSync('ledger', { recursive: true });
        fs.writeFileSync('ledger/exchange_rates.json', JSON.stringify(output, null, 2));
        console.log('🎉 汇率高精度定点数 JSON 转换并写入成功！');
    } catch (error) {
        console.error('❌ 汇率抓取与转换失败:', error);
        process.exit(1);
    }
}

updateRates();
