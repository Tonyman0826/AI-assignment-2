import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 定義要下載的運動類別和關鍵字
const categories = {
  '籃球': ['basketball game', 'basketball player', 'basketball court'],
  '足球': ['soccer game', 'football player', 'soccer field'],
  '網球': ['tennis match', 'tennis player', 'tennis court'],
  '游泳': ['swimming competition', 'swimmer', 'swimming pool'],
  '跑步': ['running race', 'marathon', 'track running'],
  '自行車': ['cycling race', 'bicycle', 'cyclist']
};

// 使用 Unsplash API 下載圖片（免費且高質量）
const UNSPLASH_ACCESS_KEY = 'YOUR_ACCESS_KEY'; // 需要申請，但我們先用模擬資料

async function downloadImage(category, keyword, index) {
  try {
    // 模擬下載 - 實際使用時需要替換為真實的 API 呼叫
    console.log(`模擬下載: ${category} - ${keyword} (圖片 ${index + 1})`);
    
    // 這裡可以替換為真實的圖片 URL
    const imageUrl = `https://picsum.photos/300/200?random=${category}-${keyword}-${index}`;
    
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream'
    });
    
    const dir = path.join('..', 'backend', 'training_data', category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filename = path.join(dir, `${category}_${keyword}_${index + 1}.jpg`);
    const writer = fs.createWriteStream(filename);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
  } catch (error) {
    console.error(`下載失敗 ${category}-${keyword}-${index}:`, error.message);
  }
}

async function downloadAllImages() {
  console.log('開始下載訓練圖片...');
  
  for (const [category, keywords] of Object.entries(categories)) {
    console.log(`\n下載 ${category} 類別圖片...`);
    
    for (const keyword of keywords) {
      for (let i = 0; i < 5; i++) { // 每個關鍵字下載 5 張
        await downloadImage(category, keyword, i);
        // 避免請求過快
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log('\n✅ 圖片下載完成！');
}

downloadAllImages();