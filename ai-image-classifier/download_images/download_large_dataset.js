import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 擴充的運動類別和關鍵字
const sportsCategories = {
  '籃球': [
    'basketball game', 'basketball player', 'NBA', 'basketball court',
    'basketball shot', 'basketball dunk', 'basketball team'
  ],
  '足球': [
    'soccer match', 'football game', 'soccer player', 'World Cup',
    'soccer goal', 'soccer field', 'football team'
  ],
  '網球': [
    'tennis match', 'tennis player', 'tennis court', 'Wimbledon',
    'tennis serve', 'tennis racket', 'tennis tournament'
  ],
  '游泳': [
    'swimming competition', 'swimmer', 'swimming pool', 'Olympic swimming',
    'swimming race', 'swimming stroke', 'swimming training'
  ],
  '跑步': [
    'running race', 'marathon', 'track running', 'sprint',
    'running competition', 'athlete running', 'running track'
  ],
  '自行車': [
    'cycling race', 'bicycle race', 'cyclist', 'Tour de France',
    'cycling competition', 'bicycle sport', 'cycling team'
  ]
};

async function downloadLargeDataset() {
  console.log('🚀 開始大量下載訓練圖片...');
  
  const browser = await chromium.launch({ 
    headless: false  // 設為 true 可後台運行
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 設定下載計數器
  let totalDownloaded = 0;
  
  try {
    for (const [category, keywords] of Object.entries(sportsCategories)) {
      console.log(`\n🎯 處理 ${category} 類別...`);
      
      // 建立分類資料夾
      const categoryDir = path.join('training_data', category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      let categoryDownloaded = 0;
      
      for (const keyword of keywords) {
        console.log(`   🔍 搜尋: ${keyword}`);
        
        // 前往 Google 圖片搜尋
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`;
        await page.goto(searchUrl);
        await page.waitForTimeout(3000);
        
        // 滾動頁面載入更多圖片
        for (let scroll = 0; scroll < 3; scroll++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1000);
        }
        
        // 獲取所有圖片元素
        const imageElements = await page.$$('img[src*="http"]');
        console.log(`   找到 ${imageElements.length} 張圖片`);
        
        // 下載前20張圖片
        for (let i = 0; i < Math.min(20, imageElements.length); i++) {
          if (categoryDownloaded >= 50) break; // 每個類別最多50張
          
          try {
            const src = await imageElements[i].getAttribute('src');
            if (src && src.startsWith('http') && !src.includes('google.com')) {
              const imageResponse = await page.goto(src);
              const imageBuffer = await imageResponse.body();
              
              const filename = path.join(categoryDir, `${category}_${keyword}_${categoryDownloaded + 1}.jpg`);
              fs.writeFileSync(filename, imageBuffer);
              
              categoryDownloaded++;
              totalDownloaded++;
              console.log(`     ✅ 下載 ${filename} (總數: ${totalDownloaded})`);
            }
          } catch (error) {
            console.log(`     ❌ 下載失敗: ${error.message}`);
          }
          
          await page.waitForTimeout(500); // 避免請求過快
        }
        
        if (categoryDownloaded >= 50) break;
      }
      
      console.log(`✅ ${category} 完成: ${categoryDownloaded} 張圖片`);
    }
    
  } catch (error) {
    console.error('❌ 程式錯誤:', error);
  } finally {
    await browser.close();
    console.log(`\n🎉 所有圖片下載完成！總共下載: ${totalDownloaded} 張圖片`);
  }
}

downloadLargeDataset();