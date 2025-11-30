import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 運動類別和對應的搜尋關鍵字
const sportsCategories = {
  '籃球': ['basketball game', 'basketball player', 'basketball shot', 'NBA game'],
  '足球': ['soccer match', 'football game', 'soccer player', 'World Cup'],
  '網球': ['tennis match', 'tennis player', 'tennis court', 'Wimbledon'],
  '游泳': ['swimming competition', 'swimmer', 'swimming pool', 'Olympic swimming'],
  '跑步': ['running race', 'marathon', 'track running', 'sprint'],
  '自行車': ['cycling race', 'bicycle race', 'cyclist', 'Tour de France']
};

async function downloadGoogleImages() {
  console.log('🚀 啟動瀏覽器自動搜尋下載...');
  
  const browser = await chromium.launch({ 
    headless: false // 設為 true 則不顯示瀏覽器
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    for (const [category, keywords] of Object.entries(sportsCategories)) {
      console.log(`\n📥 處理 ${category} 類別...`);
      
      // 建立分類資料夾
      const categoryDir = path.join('..', 'backend', 'training_data', category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      let imageCount = 0;
      
      for (const keyword of keywords) {
        if (imageCount >= 15) break; // 每個類別最多15張
        
        console.log(`  搜尋關鍵字: ${keyword}`);
        
        // 前往 Google 圖片搜尋
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`;
        await page.goto(searchUrl);
        await page.waitForTimeout(2000);
        
        // 點擊第一張圖片開啟大圖
        try {
          await page.click('div[data-ri="0"]');
          await page.waitForTimeout(1000);
          
          // 尋找大圖 URL
          const largeImage = await page.$('img[src*="http"]');
          if (largeImage) {
            const imageUrl = await largeImage.getAttribute('src');
            
            if (imageUrl && imageUrl.startsWith('http')) {
              // 下載圖片
              const imageResponse = await page.goto(imageUrl);
              const imageBuffer = await imageResponse.body();
              
              const filename = path.join(categoryDir, `${category}_${imageCount + 1}.jpg`);
              fs.writeFileSync(filename, imageBuffer);
              
              console.log(`    ✅ 下載成功: ${filename}`);
              imageCount++;
            }
          }
        } catch (error) {
          console.log(`    ❌ 下載失敗: ${error.message}`);
        }
        
        await page.waitForTimeout(1000);
      }
      
      console.log(`✅ ${category} 完成: ${imageCount} 張圖片`);
    }
    
  } catch (error) {
    console.error('❌ 程式錯誤:', error);
  } finally {
    await browser.close();
    console.log('\n🎉 所有圖片下載完成！');
  }
}

downloadGoogleImages();