import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 真正公開且穩定的免費圖片網站
const REAL_FREE_SITES = {
  'unsplash': {
    '籃球': [
      'https://unsplash.com/s/photos/basketball',
      'https://unsplash.com/s/photos/basketball-player',
      'https://unsplash.com/s/photos/basketball-game'
    ],
    '足球': [
      'https://unsplash.com/s/photos/soccer',
      'https://unsplash.com/s/photos/soccer-player', 
      'https://unsplash.com/s/photos/football-game'
    ],
    '網球': [
      'https://unsplash.com/s/photos/tennis',
      'https://unsplash.com/s/photos/tennis-player',
      'https://unsplash.com/s/photos/tennis-match'
    ],
    '游泳': [
      'https://unsplash.com/s/photos/swimming',
      'https://unsplash.com/s/photos/swimmer',
      'https://unsplash.com/s/photos/swimming-pool'
    ],
    '跑步': [
      'https://unsplash.com/s/photos/running',
      'https://unsplash.com/s/photos/runner',
      'https://unsplash.com/s/photos/marathon'
    ],
    '自行車': [
      'https://unsplash.com/s/photos/cycling',
      'https://unsplash.com/s/photos/cyclist',
      'https://unsplash.com/s/photos/bicycle'
    ]
  },
  'pixabay': {
    '籃球': [
      'https://pixabay.com/images/search/basketball/',
      'https://pixabay.com/images/search/basketball%20game/'
    ],
    '足球': [
      'https://pixabay.com/images/search/soccer/',
      'https://pixabay.com/images/search/football/'
    ],
    '網球': [
      'https://pixabay.com/images/search/tennis/',
      'https://pixabay.com/images/search/tennis%20match/'
    ],
    '游泳': [
      'https://pixabay.com/images/search/swimming/',
      'https://pixabay.com/images/search/swimmer/'
    ],
    '跑步': [
      'https://pixabay.com/images/search/running/',
      'https://pixabay.com/images/search/marathon/'
    ],
    '自行車': [
      'https://pixabay.com/images/search/cycling/',
      'https://pixabay.com/images/search/bicycle/'
    ]
  },
  'pexels': {
    '籃球': [
      'https://www.pexels.com/search/basketball/',
      'https://www.pexels.com/search/basketball%20game/'
    ],
    '足球': [
      'https://www.pexels.com/search/soccer/',
      'https://www.pexels.com/search/football/'
    ],
    '網球': [
      'https://www.pexels.com/search/tennis/',
      'https://www.pexels.com/search/tennis%20match/'
    ],
    '游泳': [
      'https://www.pexels.com/search/swimming/',
      'https://www.pexels.com/search/swimmer/'
    ],
    '跑步': [
      'https://www.pexels.com/search/running/',
      'https://www.pexels.com/search/marathon/'
    ],
    '自行車': [
      'https://www.pexels.com/search/cycling/',
      'https://www.pexels.com/search/bicycle/'
    ]
  }
};

async function downloadFromRealSites() {
  console.log('🚀 從真正公開網站批量下載...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800  // 更慢的操作，確保穩定
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });
  page.setDefaultTimeout(20000);

  let totalDownloaded = 0;

  for (const [siteName, categories] of Object.entries(REAL_FREE_SITES)) {
    console.log(`\n🌐 使用網站: ${siteName.toUpperCase()}`);
    
    for (const [category, urls] of Object.entries(categories)) {
      console.log(`\n📥 下載 ${category}...`);
      
      const categoryDir = path.join('..', 'backend', 'training_data', category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // 檢查現有數量
      let existingCount = fs.readdirSync(categoryDir).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png')
      ).length;
      
      console.log(`   現有: ${existingCount} 張`);
      
      if (existingCount >= 100) {
        console.log(`   ✅ 已足夠，跳過`);
        totalDownloaded += existingCount;
        continue;
      }
      
      let downloadedInCategory = 0;
      
      for (const url of urls) {
        if (existingCount + downloadedInCategory >= 100) break;
        
        try {
          console.log(`   前往: ${url}`);
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000); // 等待更長時間
          
          // 多次滾動載入更多圖片
          for (let scroll = 0; scroll < 6; scroll++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(3000);
          }
          
          let imageUrls = [];
          
          // 根據不同網站提取圖片
          if (siteName === 'unsplash') {
            imageUrls = await page.$$eval('img[src*="images.unsplash.com"]', imgs => 
              imgs.map(img => img.src)
                .filter(src => src.includes('&w=') && !src.includes('profile'))
                .slice(0, 50)
            );
          } else if (siteName === 'pixabay') {
            imageUrls = await page.$$eval('img[src*="cdn.pixabay.com"]', imgs => 
              imgs.map(img => img.src)
                .filter(src => src.includes('_640.jpg') || src.includes('_960_720'))
                .slice(0, 40)
            );
          } else if (siteName === 'pexels') {
            imageUrls = await page.$$eval('img[src*="images.pexels.com"]', imgs => 
              imgs.map(img => img.src)
                .filter(src => src.includes('/photos/'))
                .slice(0, 40)
            );
          }
          
          console.log(`   找到 ${imageUrls.length} 張圖片`);
          
          // 下載圖片
          for (let i = 0; i < imageUrls.length; i++) {
            if (existingCount + downloadedInCategory >= 100) break;
            
            try {
              const imageUrl = imageUrls[i];
              console.log(`   下載 ${i + 1}/${imageUrls.length}`);
              
              const response = await page.goto(imageUrl, { 
                waitUntil: 'load', 
                timeout: 15000 
              });
              
              if (response && response.status() === 200) {
                const buffer = await response.body();
                
                // 檢查圖片大小
                if (buffer.length > 30000) {
                  const filename = path.join(categoryDir, 
                    `${siteName}_${category}_${existingCount + downloadedInCategory + 1}.jpg`);
                  fs.writeFileSync(filename, buffer);
                  
                  downloadedInCategory++;
                  totalDownloaded++;
                  
                  console.log(`     ✅ 第 ${existingCount + downloadedInCategory} 張`);
                }
              }
              
              await page.waitForTimeout(2000); // 每次下載間隔2秒
              
            } catch (error) {
              console.log(`     ❌ 下載失敗，繼續下一張`);
            }
          }
          
        } catch (error) {
          console.log(`   ❌ 頁面載入失敗: ${error.message}`);
        }
        
        await page.waitForTimeout(3000);
      }
      
      console.log(`   📊 ${category} 本次新增: ${downloadedInCategory} 張`);
      console.log(`   📈 ${category} 總數: ${existingCount + downloadedInCategory} 張`);
    }
  }
  
  await browser.close();
  
  console.log(`\n🎉 下載完成！總共: ${totalDownloaded} 張圖片`);
  
  // 顯示最終統計
  console.log(`\n📈 各類別最終數量:`);
  for (const category of Object.keys(REAL_FREE_SITES.unsplash)) {
    const categoryDir = path.join('..', 'backend', 'training_data', category);
    if (fs.existsSync(categoryDir)) {
      const count = fs.readdirSync(categoryDir).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png')
      ).length;
      console.log(`   ${category}: ${count} 張`);
    }
  }
}

downloadFromRealSites();