const fs = require('fs-extra');
const path = require('path');

class LabelManager {
  constructor(dbManager) {
    this.db = dbManager;
    this.labeledData = [];
    this.labelsPath = './data/labels';
  }

  async initialize() {
    await fs.ensureDir(this.labelsPath);
    await this.loadLabeledData();
  }

  async loadLabeledData() {
    try {
      const data = await fs.readJson(path.join(this.labelsPath, 'labeled-images.json'));
      this.labeledData = data;
      console.log(`📝 加載了 ${this.labeledData.length} 個已標記圖片`);
    } catch (error) {
      this.labeledData = [];
      console.log('📝 沒有找到已標記數據，創建新的數據集');
    }
  }

  async saveLabeledData() {
    await fs.writeJson(path.join(this.labelsPath, 'labeled-images.json'), this.labeledData);
    console.log(`💾 已保存 ${this.labeledData.length} 個標記數據`);
  }

async addLabel(imagePath, sportType, confidence = 1.0) {
  try {
    console.log(`🏷️ 添加標記: ${imagePath} -> ${sportType}`);
    
    // 標準化路徑
    let normalizedPath = imagePath;
    if (imagePath.includes('data/raw/')) {
      // 如果已經是完整路徑，保持不變
      normalizedPath = imagePath;
    } else {
      // 否則構建完整路徑
      const fileName = path.basename(imagePath);
      normalizedPath = `./data/raw/${fileName}`;
    }
    
    // 檢查是否已標記
    const existingLabel = this.labeledData.find(item => item.imagePath === normalizedPath);
    if (existingLabel) {
      console.log('⚠️ 圖片已標記，更新標記:', existingLabel.sportType, '->', sportType);
      existingLabel.sportType = sportType;
      existingLabel.labeledAt = new Date().toISOString();
    } else {
      // 添加新標記
      const label = {
        imagePath: normalizedPath,
        sportType: sportType,
        confidence: confidence,
        labeledAt: new Date().toISOString(),
        timestamp: Date.now()
      };
      this.labeledData.push(label);
    }
    
    await this.saveLabeledData();
    
    console.log(`✅ 標記已保存，總標記數: ${this.labeledData.length}`);
    return { success: true, labeledCount: this.labeledData.length };
    
  } catch (error) {
    console.error('❌ 添加標記失敗:', error);
    throw error;
  }
}

async getUnlabeledImages(limit = 1000) {
  try {
    const dbData = this.db.getAllData();
    const allImages = dbData.images || [];
    const labeledPaths = new Set(this.labeledData.map(item => item.imagePath));
    
    console.log(`🔍 過濾未標記圖片: 總圖片=${allImages.length}, 已標記=${labeledPaths.size}`);
    
    const unlabeled = allImages.filter(img => {
      // 檢查圖片是否已標記
      const isLabeled = labeledPaths.has(img.file_path);
      // 檢查文件是否存在（可選）
      const fileExists = fs.existsSync(img.file_path);
      return !isLabeled && fileExists;
    });
    
    console.log(`✅ 找到 ${unlabeled.length} 個未標記圖片`);
    
    // 如果指定了限制，返回前N個
    return limit ? unlabeled.slice(0, limit) : unlabeled;
    
  } catch (error) {
    console.error('❌ 獲取未標記圖片失敗:', error);
    return [];
  }
}
getLabeledStats() {
  const stats = {
    basketball: 0,
    soccer: 0,
    tennis: 0,
    baseball: 0,
    swimming: 0,
    running: 0,
    other: 0
  };
  
  this.labeledData.forEach(item => {
    if (stats.hasOwnProperty(item.sportType)) {
      stats[item.sportType]++;
    } else {
      stats.other++;
    }
  });
  
  console.log('📊 標記統計:', stats);
  return stats;
}