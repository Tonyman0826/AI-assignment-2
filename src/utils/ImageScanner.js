const fs = require('fs-extra');
const path = require('path');
const Jimp = require('jimp');

class ImageScanner {
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
    let processedCount = 0;
    
    console.log(`📁 找到 ${files.length} 個文件，開始掃描...`);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (this.supportedFormats.includes(ext)) {
        try {
          const stats = await fs.stat(filePath);
          
          // 使用 Jimp 讀取圖片尺寸
          const image = await Jimp.read(filePath);
          const { width, height } = image.bitmap;
          
          imageFiles.push({
            file_path: filePath,
            file_name: file,
            file_size: stats.size,
            width: width,
            height: height,
            extension: ext
          });
          
          processedCount++;
          if (processedCount % 100 === 0) {
            console.log(`📊 已掃描 ${processedCount} 個圖片文件...`);
          }
          
        } catch (error) {
          console.log(`❌ 無法讀取圖片: ${file} - ${error.message}`);
        }
      }
    }
    
    console.log(`✅ 成功掃描 ${imageFiles.length} 個圖片文件`);
    return imageFiles;
  }
  
  // 快速掃描方法（只檢查文件存在性，不讀取尺寸）
  async quickScanImageFolder(folderPath) {
    console.log(`⚡ 快速掃描圖片文件夾: ${folderPath}`);
    
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
    
    console.log(`✅ 快速掃描找到 ${imageFiles.length} 個圖片文件`);
    return imageFiles;
  }
}

module.exports = ImageScanner;