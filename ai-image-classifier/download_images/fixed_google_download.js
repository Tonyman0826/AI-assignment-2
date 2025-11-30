import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const sportsCategories = {
  '籃球': 'basketball game',
  '足球': 'soccer match', 
  '網球': 'tennis match',
  '游泳': 'swimming competition',
  '跑步': 'running race',
  '自行車': 'cycling race'
};

async function downloadGoogleImages() {
  console.log('🚀 啟動瀏覽器自動搜尋下載...');
  
  const browser = await chromium.launch({ 
    headless: false // 設為 true 則不顯示瀏覽器
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });
  
  try {
    for (const [category, keyword] of Object.entries(sportsCategories)) {
      console.log(`\n📥 處理 ${category} 類別: ${keyword}`);
      
      // 建立分類資料夾
      const categoryDir = path.join('..', 'backend', 'training_data', category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // 前往 Google 圖片搜尋
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=isch`;
      console.log(`   前往: ${searchUrl}`);
      await page.goto(searchUrl);
      await page.waitForTimeout(3000);
      
      // 嘗試多種選擇器點擊第一張圖片
      let imageClicked = false;
      
      // 方法1: 嘗試點擊圖片網格的第一個項目
      try {
        const firstImage = page.locator('div[jsname] img').first();
        await firstImage.click({ timeout: 3000 });
        imageClicked = true;
        console.log('   ✅ 成功點擊圖片 (方法1)');
      } catch (error) {
        console.log('   ❌ 方法1失敗');
      }
      
      // 方法2: 如果方法1失敗，嘗試其他選擇器
      if (!imageClicked) {
        try {
          const firstImage = page.locator('div[data-ri]').first();
          await firstImage.click({ timeout: 3000 });
          imageClicked = true;
          console.log('   ✅ 成功點擊圖片 (方法2)');
        } catch (error) {
          console.log('   ❌ 方法2失敗');
        }
      }
      
      // 方法3: 使用更通用的選擇器
      if (!imageClicked) {
        try {
          const firstImage = page.locator('div[role="listitem"]').first();
          await firstImage.click({ timeout: 3000 });
          imageClicked = true;
          console.log('   ✅ 成功點擊圖片 (方法3)');
        } catch (error) {
          console.log('   ❌ 方法3失敗');
        }
      }
      
      if (imageClicked) {
        await page.waitForTimeout(2000);
        
        // 尋找大圖
        const largeImage = await page.locator('img[src*="http"]').first();
        if (await largeImage.count() > 0) {
          const imageUrl = await largeImage.getAttribute('src');
          
          if (imageUrl && imageUrl.startsWith('http')) {
            try {
              // 下載圖片
              const imageResponse = await page.goto(imageUrl);
              const imageBuffer = await imageResponse.body();
              
              const filename = path.join(categoryDir, `${category}_1.jpg`);
              fs.writeFileSync(filename, imageBuffer);
              
              console.log(`   ✅ 下載成功: ${filename}`);
            } catch (error) {
              console.log(`   ❌ 下載失敗: ${error.message}`);
            }
          }
        }
      }
      
      // 下載更多圖片 - 直接在搜尋頁面下載縮圖
      console.log('   📥 下載搜尋結果縮圖...');
      const thumbnails = await page.$$('img[src*="http"]');
      
      for (let i = 0; i < Math.min(5, thumbnails.length); i++) {
        try {
          const src = await thumbnails[i].getAttribute('src');
          if (src && src.startsWith('http')) {
            const imageResponse = await page.goto(src);
            const imageBuffer = await imageResponse.body();
            
            const filename = path.join(categoryDir, `${category}_thumb_${i + 1}.jpg`);
            fs.writeFileSync(filename, imageBuffer);
            
            console.log(`   ✅ 下載縮圖: ${filename}`);
          }
        } catch (error) {
          console.log(`   ❌ 縮圖下載失敗: ${error.message}`);
        }
      }
      
      await page.waitForTimeout(2000);
    }
    
  } catch (error) {
    console.error('❌ 程式錯誤:', error);
  } finally {
    await browser.close();
    console.log('\n🎉 所有圖片下載完成！');
  }
}

downloadGoogleImages();