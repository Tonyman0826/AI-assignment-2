const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.db = null;
  }
  
  async initialize(dbManager) {
    this.db = dbManager;
    console.log('✅ 報告生成器初始化完成');
  }
  
  async generateReport() {
    try {
      const stats = await this.calculateStats();
      
      console.log('\n📊 ===== 圖像數據集清理報告 =====');
      console.log(`📁 原始圖像數量: ${stats.originalCount}`);
      console.log(`✅ 清理後數量: ${stats.cleanedCount}`);
      console.log(`🗑️  刪除總數: ${stats.removedCount}`);
      console.log(`🔁 重複圖像: ${stats.duplicateCount}`);
      console.log(`🚫 非運動圖像: ${stats.nonSportsCount}`);
      console.log(`❌ 錯誤文件: ${stats.errorCount}`);
      console.log(`🌐 唯一網域: ${stats.uniqueDomains}`);
      console.log(`📄 爬取頁數: ${stats.pagesCrawled}`);
      
      // 檢查數據集大小是否符合要求
      const datasetStatus = this.checkDatasetSize(stats.cleanedCount);
      console.log(`📋 數據集狀態: ${datasetStatus}`);
      
      await this.saveReportToFile(stats);
      return stats;
      
    } catch (error) {
      console.log('❌ 生成報告時出錯:', error.message);
      return this.generateFallbackReport();
    }
  }
  
  async calculateStats() {
    if (!this.db) {
      return this.getDefaultStats();
    }
    
    const dbData = this.db.getAllData();
    const images = dbData.images || [];
    const sessions = dbData.crawl_sessions || [];
    
    const originalCount = images.length;
    const cleanedCount = images.filter(img => img.is_cleaned && img.category === 'sports').length;
    const duplicateCount = images.filter(img => img.category === 'duplicate').length;
    const nonSportsCount = images.filter(img => img.category === 'non-sports').length;
    const errorCount = images.filter(img => 
      img.category === 'invalid' || 
      img.category === 'error' ||
      img.category === 'file-not-found'
    ).length;
    
    // 計算唯一網域
    const domains = images.map(img => img.domain).filter(domain => domain);
    const uniqueDomains = new Set(domains).size;
    
    // 計算爬取頁數
    const pagesCrawled = sessions.reduce((total, session) => {
      return total + (session.pages_crawled || 0);
    }, 0);
    
    return {
      originalCount,
      cleanedCount,
      removedCount: duplicateCount + nonSportsCount + errorCount,
      duplicateCount,
      nonSportsCount,
      errorCount,
      uniqueDomains,
      pagesCrawled
    };
  }
  
  getDefaultStats() {
    return {
      originalCount: 0,
      cleanedCount: 0,
      removedCount: 0,
      duplicateCount: 0,
      nonSportsCount: 0,
      errorCount: 0,
      uniqueDomains: 0,
      pagesCrawled: 0
    };
  }
  
  checkDatasetSize(cleanedCount) {
    if (cleanedCount >= 500 && cleanedCount <= 2000) {
      return '✅ 符合要求 (500-2000 個圖像)';
    } else if (cleanedCount < 500) {
      return `⚠️ 需要擴充 (目前: ${cleanedCount}, 需要至少 500)`;
    } else {
      return `⚠️ 需要縮減 (目前: ${cleanedCount}, 需要最多 2000)`;
    }
  }
  
  async generateFallbackReport() {
    console.log('\n📊 ===== 基本清理報告 =====');
    console.log('ℹ️ 使用備用報告生成');
    console.log('💡 請檢查數據文件夾中的實際圖像');
    
    const fallbackStats = this.getDefaultStats();
    await this.saveReportToFile(fallbackStats);
    return fallbackStats;
  }
  
  async saveReportToFile(stats) {
    try {
      const reportDir = path.join(__dirname, '../../docs');
      await fs.ensureDir(reportDir);
      
      const reportPath = path.join(reportDir, 'cleaning_report.txt');
      const reportContent = `
圖像數據集清理報告
生成時間: ${new Date().toLocaleString('zh-TW')}

統計數據:
==========
原始圖像數量: ${stats.originalCount}
清理後數量: ${stats.cleanedCount}
刪除總數: ${stats.removedCount}
├─ 重複圖像: ${stats.duplicateCount}
├─ 非運動圖像: ${stats.nonSportsCount}
└─ 錯誤文件: ${stats.errorCount}

來源分析:
==========
唯一網域數量: ${stats.uniqueDomains}
爬取頁數: ${stats.pagesCrawled}

數據集狀態: ${this.checkDatasetSize(stats.cleanedCount)}

備註:
==========
- 此報告基於內存數據庫生成
- 實際圖像文件請檢查 data/raw/ 和 data/cleaned/ 文件夾
- 如需完整功能，請添加實際的圖像文件
      `.trim();
      
      await fs.writeFile(reportPath, reportContent, 'utf8');
      console.log(`\n📄 報告已保存至: ${reportPath}`);
      
    } catch (error) {
      console.log('❌ 保存報告文件失敗:', error.message);
    }
  }
  
  // 生成詳細的 HTML 報告（可選）
  async generateHTMLReport() {
    const stats = await this.calculateStats();
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>圖像數據集清理報告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .stats { margin: 20px 0; }
        .stat-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #007acc; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 圖像數據集清理報告</h1>
        <p>生成時間: ${new Date().toLocaleString('zh-TW')}</p>
    </div>
    
    <div class="stats">
        <h2>統計數據</h2>
        <div class="stat-item">原始圖像數量: ${stats.originalCount}</div>
        <div class="stat-item">清理後數量: ${stats.cleanedCount}</div>
        <div class="stat-item">刪除總數: ${stats.removedCount}</div>
        <div class="stat-item">重複圖像: ${stats.duplicateCount}</div>
        <div class="stat-item">非運動圖像: ${stats.nonSportsCount}</div>
        <div class="stat-item">錯誤文件: ${stats.errorCount}</div>
    </div>
    
    <div class="stats">
        <h2>來源分析</h2>
        <div class="stat-item">唯一網域數量: ${stats.uniqueDomains}</div>
        <div class="stat-item">爬取頁數: ${stats.pagesCrawled}</div>
    </div>
    
    <div class="stats">
        <h2>數據集狀態</h2>
        <div class="stat-item ${stats.cleanedCount >= 500 && stats.cleanedCount <= 2000 ? 'success' : 'warning'}">
            ${this.checkDatasetSize(stats.cleanedCount)}
        </div>
    </div>
</body>
</html>
    `;
    
    const reportDir = path.join(__dirname, '../../docs');
    await fs.ensureDir(reportDir);
    const htmlPath = path.join(reportDir, 'report.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
    
    console.log(`📄 HTML 報告已保存至: ${htmlPath}`);
  }
}

module.exports = ReportGenerator;