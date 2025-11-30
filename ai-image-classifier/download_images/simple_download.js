import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const sportsCategories = {
  '籃球': 'basketball',
  '足球': 'soccer', 
  '網球': 'tennis',
  '游泳': 'swimming',
  '跑步': 'running',
  '自行車': 'cycling'
};

async function downloadThumbnails() {
  console.log('🚀 開始下載圖片縮圖...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  for (const [category, keyword] of Object.entries(sportsCategories)) {
    console.log(`\n📥 下載 ${category} 圖片...`);
    
    const categoryDir = path.join('..', 'backend', 'training_data', category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    await page.goto(`https://www.google.com/search?q=${keyword}+sport&tbm=isch`);
    await page.waitForTimeout(3000);
    
    // 直接下載所有可見的圖片
    const images = await page.$$eval('img[src*="http"]', imgs => 
      imgs.map(img => img.src).filter(src => src.startsWith('http'))
    );
    
    for (let i = 0; i < Math.min(10, images.length); i++) {
      try {
        const imageResponse = await page.goto(images[i]);
        const imageBuffer = await imageResponse.body();
        
        const filename = path.join(categoryDir, `${category}_${i + 1}.jpg`);
        fs.writeFileSync(filename, imageBuffer);
        
        console.log(`   ✅ 下載: ${filename}`);
      } catch (error) {
        console.log(`   ❌ 下載失敗: ${error.message}`);
      }
    }
  }
  
  await browser.close();
  console.log('\n🎉 下載完成！');
}

downloadThumbnails();