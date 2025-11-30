console.log('🐛 調試模式啟動...');

// 測試路徑解析
const path = require('path');
console.log('當前目錄:', __dirname);
console.log('數據庫文件路徑:', path.join(__dirname, 'database', 'DatabaseManager.js'));

// 嘗試加載模塊
try {
  const dbPath = './database/DatabaseManager';
  console.log('嘗試加載:', dbPath);
  
  const DatabaseManager = require(dbPath);
  console.log('✅ DatabaseManager 加載成功');
  
  const db = new DatabaseManager();
  db.initialize();
  console.log('✅ 數據庫初始化成功');
  
} catch (error) {
  console.log('❌ 加載失敗:', error.message);
  console.log('錯誤堆棧:', error.stack);
  
  // 嘗試其他路徑
  console.log('\n🔧 嘗試其他路徑...');
  try {
    const DatabaseManager = require('./database/DatabaseManager.js');
    console.log('✅ 使用 .js 擴展名加載成功');
  } catch (error2) {
    console.log('❌ 再次失敗:', error2.message);
  }
}