const ImageCleaner = require('./cleaner/ImageCleaner');
const DatabaseManager = require('./database/DatabaseManager');
const ReportGenerator = require('./reports/ReportGenerator');
const DashboardServer = require('./server/DashboardServer');
const AdminServer = require('./server/AdminServer');
const ModelTrainer = require('./training/ModelTrainer');
const LabelManager = require('./training/LabelManager');
const SmartClassifier = require('./classifier/SmartClassifier');

console.log('🔍 檢查模塊加載...');

async function main() {
  console.log('🚀 開始運動員圖像數據集清理作業...');
  
  try {
    // 初始化數據庫
    console.log('🔄 初始化數據庫...');
    const dbManager = new DatabaseManager();
    dbManager.initialize();
    
    // 初始化標記管理器
    console.log('🔄 初始化標記管理器...');
    const labelManager = new LabelManager(dbManager);
    await labelManager.initialize();
    
    // 初始化模型訓練器
    console.log('🔄 初始化模型訓練器...');
    const modelTrainer = new ModelTrainer();
    
    // 初始化智能分類器
    console.log('🔄 初始化智能分類器...');
    const smartClassifier = new SmartClassifier(labelManager, modelTrainer);
    await smartClassifier.initialize();
    
    // 啟動用戶儀表板
    console.log('🔄 啟動用戶儀表板...');
    const dashboard = new DashboardServer(dbManager, 3000);
    dashboard.start();
    
    // 啟動管理界面
    console.log('🔄 啟動管理界面...');
    const adminServer = new AdminServer(dbManager, labelManager, modelTrainer, 3001);
    adminServer.start();
    
    // 初始化清理器（使用智能分類器）
    console.log('🔄 初始化清理器...');
    const cleaner = new ImageCleaner();
    await cleaner.initialize(dbManager, labelManager, modelTrainer);
    
    // 執行清理
    console.log('🔄 開始清理數據集...');
    await cleaner.cleanDataset();
    
    // 生成報告
    console.log('🔄 生成報告...');
    const reporter = new ReportGenerator();
    await reporter.initialize(dbManager);
    await reporter.generateReport();
    
    // 生成HTML報告
    await reporter.generateHTMLReport();
    
    console.log('\n🎉 所有作業完成！');
    console.log('📊 查看用戶儀表板: http://localhost:3000');
    console.log('🎛️  查看管理界面: http://localhost:3001');
    console.log('📄 查看文本報告: docs/cleaning_report.txt');
    console.log('📊 查看HTML報告: docs/report.html');
    
    // 顯示AI學習狀態
    const aiStatus = smartClassifier.getStatus();
    console.log(`\n🧠 AI 學習狀態: ${aiStatus.learningProgress}`);
    console.log(`📝 已標記圖片: ${aiStatus.labeledDataCount} 張`);
    console.log('💡 提示: 標記更多圖片可以提升AI分類準確度！');
    
  } catch (error) {
    console.error('❌ 程序執行失敗:', error.message);
    console.error('錯誤詳情:', error.stack);
  }
}

// 執行主程序
main();