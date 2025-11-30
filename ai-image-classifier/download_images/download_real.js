import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 使用現成的運動圖片資料集
const SPORTS_DATASET_URLS = {
  '籃球': [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    'https://images.unsplash.com/photo-1519861155730-0b9e0f8d6c60',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a'
  ],
  '足球': [
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018'
  ],
  '網球': [
    'https://images.unsplash.com/photo-1595435742668-9863089fa7f3',
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431f5',
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de'
  ],
  '游泳': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635',
    'https://images.unsplash.com/photo-1558618666-fcd25856cd25'
  ],
  '跑步': [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
    'https://images.unsplash.com/photo-1550662796-de6ca9fd5d3c',
    'https://images.unsplash.com/photo-1551135040-4a5dd0ad8c4d'
  ],
  '自行車': [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    'https://images.unsplash.com/photo-1507035895480-2e5ab5c2b13b',
    'https://images.unsplash.com/photo-1511994298241-608e28f14fde'
  ]
};

async function downloadRealSportsImages() {
  console.log('🚀 開始下載真實運動圖片...');
  
  for (const [category, urls] of Object.entries(SPORTS_DATASET_URLS)) {
    console.log(`\n📥 下載 ${category} 圖片...`);
    
    const dir = path.join('..', 'backend', 'training_data', category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`  下載 ${category} 圖片 ${i + 1}/${urls.length}`);
        
        const response = await axios({
          method: 'GET',
          url: urls[i],
          responseType: 'stream',
          timeout: 10000
        });
        
        const filename = path.join(dir, `${category}_${i + 1}.jpg`);
        const writer = fs.createWriteStream(filename);
        
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        // 避免請求過快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  下載失敗: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ 真實運動圖片下載完成！');
  console.log('📁 圖片已保存到 backend/training_data/');
}

downloadRealSportsImages();