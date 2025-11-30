import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

const sportsCategories = {
  '籃球': 'basketball',
  '足球': 'soccer', 
  '網球': 'tennis',
  '游泳': 'swimming',
  '跑步': 'running',
  '自行車': 'cycling'
};

async function downloadMultipleImages() {
  console.log('🚀 開始批量下載運動圖片...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    for (const [chineseCategory, englishCategory] of Object.entries(sportsCategories)) {
      console.log(`\n📥 下載 ${chineseCategory} 圖片...`);
      
      const categoryDir = path.join('..', 'backend', 'training_data', chineseCategory);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // 搜尋圖片
      await page.goto(`https://www.google.com/search?q=${englishCategory}+sport&tbm=isch`);
      await page.waitForTimeout(3000);
      
      // 獲取前10張圖片預覽
      const imageElements = await page.$$('img[src*="http"]');
      
      for (let i = 0; i < Math.min(10, imageElements.length); i++) {
        try {
          // 點擊圖片
          await imageElements[i].click();
          await page.waitForTimeout(1000);
          
          // 獲取大圖 URL
          const largeImage = await page.$('img[src*="http"]');
          if (largeImage) {
            const src = await largeImage.getAttribute('src');
            if (src && src.startsWith('http')) {
              // 下載圖片
              const response = await axios({
                method: 'GET',
                url: src,
                responseType: 'arraybuffer',
                timeout: 10000
              });
              
              const filename = path.join(categoryDir, `${chineseCategory}_${i + 1}.jpg`);
              fs.writeFileSync(filename, Buffer.from(response.data));
              console.log(`   ✅ 下載 ${filename}`);
            }
          }
        } catch (error) {
          console.log(`   ❌ 第 ${i + 1} 張下載失敗`);
        }
        
        await page.waitForTimeout(500);
      }
    }
  } catch (error) {
    console.error('錯誤:', error);
  } finally {
    await browser.close();
    console.log('\n🎉 下載完成！');
  }
}

downloadMultipleImages();