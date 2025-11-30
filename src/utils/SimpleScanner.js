const fs = require('fs-extra');
const path = require('path');

class SimpleScanner {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  }
  
  async scanImageFolder(folderPath) {
    console.log(`🔍 掃描圖片文件夾: ${folderPath}`);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`❌ 文件夾不存在: ${folderPath}`);
      return [];
    }
    
    const files = await fs.readdir(folderPath);
    const imageFiles = [];
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (this.supportedFormats.includes(ext)) {
        try {
          const stats = await fs.stat(filePath);
          
          imageFiles.push({
            file_path: filePath,
            file_name: file,
            file_size: stats.size,
            width: 0, // 暫時不讀取尺寸
            height: 0,
            extension: ext
          });
        } catch (error) {
          console.log(`❌ 無法訪問文件: ${file} - ${error.message}`);
        }
      }
    }
    
    console.log(`✅ 找到 ${imageFiles.length} 個圖片文件`);
    return imageFiles;
  }
}

module.exports = SimpleScanner;