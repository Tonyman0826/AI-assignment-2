const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const SimpleScanner = require('../utils/SimpleScanner');

class ImageCleaner {
  constructor() {
    this.classifier = null;
    this.db = null;
    this.stats = {
      total: 0,
      cleaned: 0,
      duplicates: 0,
      nonSports: 0,
      errors: 0,
      classificationMethods: {}
    };
  }
  
  async initialize(db, labelManager, modelTrainer) {
    this.db = db;
    
    // 動態導入 SmartClassifier
    const SmartClassifier = require('../classifier/SmartClassifier');
    this.classifier = new SmartClassifier(labelManager, modelTrainer);
    await this.classifier.initialize();
    
    console.log('✅ 清理器初始化完成（智能分類模式）');
    
    // 顯示分類器狀態
    const status = this.classifier.getStatus();
    console.log(`🎯 分類器狀態: ${status.method}, 學習進度: ${status.learningProgress}`);
  }
  
  async cleanDataset() {
    console.log('🔄 開始清理圖像數據集...');
    
    // 掃描實際的圖片文件夾
    const scanner = new SimpleScanner();
    const rawImages = await scanner.scanImageFolder('./data/raw');
    
    if (rawImages.length === 0) {
      console.log('📝 沒有找到實際圖片，創建測試數據...');
      await this.createTestImages();
      return;
    }
    
    console.log(`📊 找到 ${rawImages.length} 個實際圖片文件`);
    
    // 將實際圖片添加到數據庫
    for (const imageFile of rawImages) {
      this.db.insertImage({
        url: `file://${imageFile.file_path}`,
        domain: 'local',
        file_path: imageFile.file_path,
        file_size: imageFile.file_size,
        width: imageFile.width,
        height: imageFile.height,
        category: 'unknown',
        sport_type: 'unknown',
        is_cleaned: false
      });
    }
    
    // 現在處理數據庫中的圖片
    const dbImages = this.db.getRawImages();
    this.stats.total = dbImages.length;
    
    console.log(`📊 開始處理 ${this.stats.total} 個圖片...`);
    
    for (let i = 0; i < dbImages.length; i++) {
      const image = dbImages[i];
      await this.processImage(image, i + 1, dbImages.length);
    }
    
    await this.generateReport();
  }
  
  async processImage(image, current, total) {
    try {
      console.log(`🔍 處理圖像 ${current}/${total}: ${path.basename(image.file_path)}`);
      
      // 檢查文件是否存在
      if (!fs.existsSync(image.file_path)) {
        console.log(`❌ 文件不存在: ${image.file_path}`);
        this.db.updateImage(image.id, { 
          is_cleaned: true,
          category: 'file-not-found'
        });
        this.stats.errors++;
        return;
      }
      
      // 1. 檢查圖像是否有效
      if (!await this.isValidImage(image.file_path)) {
        console.log(`❌ 無效圖像: ${path.basename(image.file_path)}`);
        await this.markForDeletion(image, 'invalid');
        this.stats.errors++;
        return;
      }
      
      // 2. 檢查重複圖像
      const hash = await this.calculateImageHash(image.file_path);
      if (await this.isDuplicate(hash, image.id)) {
        console.log(`🔁 重複圖像: ${path.basename(image.file_path)}`);
        await this.markForDeletion(image, 'duplicate');
        this.stats.duplicates++;
        return;
      }
      
      // 3. 使用智能分類器檢查是否為運動相關圖像
      const classification = await this.classifier.classifyImage(image.file_path);
      
      // 記錄分類方法
      this.stats.classificationMethods[classification.method] = 
        (this.stats.classificationMethods[classification.method] || 0) + 1;
      
      console.log(`🎯 分類結果: ${path.basename(image.file_path)} - 運動: ${classification.isSports}, 類型: ${classification.sportType}, 方法: ${classification.method}, 置信度: ${classification.confidence}`);
      
      if (!classification.isSports) {
        console.log(`🚫 非運動圖像: ${path.basename(image.file_path)}`);
        await this.markForDeletion(image, 'non-sports');
        this.stats.nonSports++;
        return;
      }
      
      // 4. 保存清理後的圖像
      await this.saveCleanedImage(image, hash, classification);
      this.stats.cleaned++;
      console.log(`✅ 保留圖像: ${path.basename(image.file_path)} - 運動類型: ${classification.sportType} (${classification.method})`);
      
    } catch (error) {
      console.log(`❌ 處理圖像時出錯: ${error.message}`);
      this.stats.errors++;
    }
  }
  
  async isValidImage(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size < 1024) {
        console.log('❌ 文件太小');
        return false;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
      if (!validExtensions.includes(ext)) {
        console.log('❌ 不支持的文件格式');
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('❌ 文件訪問錯誤:', error.message);
      return false;
    }
  }
  
  async calculateImageHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }
  
  async isDuplicate(hash, currentImageId) {
    const existing = this.db.findImages({ file_hash: hash });
    return existing.some(img => img.id !== currentImageId);
  }
  
  async markForDeletion(image, reason) {
    this.db.updateImage(image.id, { 
      is_cleaned: true,
      category: reason
    });
    console.log(`🗑️  標記為刪除: ${reason}`);
  }
  
  async saveCleanedImage(image, hash, classification) {
    const cleanedDir = path.join(__dirname, '../../data/cleaned');
    await fs.ensureDir(cleanedDir);
    
    const ext = path.extname(image.file_path);
    const newPath = path.join(cleanedDir, `${hash}${ext}`);
    
    await fs.copy(image.file_path, newPath);
    
    this.db.updateImage(image.id, {
      is_cleaned: true,
      file_hash: hash,
      category: 'sports',
      sport_type: classification.sportType,
      classification_method: classification.method,
      confidence: classification.confidence,
      file_path: newPath
    });
  }
  
  async generateReport() {
    console.log('\n📊 === 智能清理報告 ===');
    console.log(`原始圖像數量: ${this.stats.total}`);
    console.log(`清理後數量: ${this.stats.cleaned}`);
    console.log(`刪除重複圖像: ${this.stats.duplicates}`);
    console.log(`刪除非運動圖像: ${this.stats.nonSports}`);
    console.log(`處理錯誤: ${this.stats.errors}`);
    
    console.log('\n🎯 分類方法統計:');
    Object.entries(this.stats.classificationMethods).forEach(([method, count]) => {
      console.log(`  ${method}: ${count} 張`);
    });
    
    // 顯示分類器學習狀態
    const status = this.classifier.getStatus();
    console.log(`\n🧠 AI 學習狀態: ${status.learningProgress} (${status.labeledDataCount} 張標記)`);
    
    this.db.insertCleanupStats({
      original_count: this.stats.total,
      cleaned_count: this.stats.cleaned,
      removed_count: this.stats.duplicates + this.stats.nonSports + this.stats.errors,
      duplicate_count: this.stats.duplicates,
      classification_methods: this.stats.classificationMethods,
      learning_status: status.learningProgress
    });
  }
  
  async createTestImages() {
    console.log('🎯 創建示例圖像數據...');
    
    const testImages = [
      {
        url: 'https://example.com/basketball.jpg',
        domain: 'example.com',
        file_path: './data/raw/basketball.jpg',
        file_hash: '',
        file_size: 102400,
        width: 800,
        height: 600,
        category: 'unknown',
        sport_type: 'unknown',
        is_cleaned: false
      }
    ];
    
    for (const imageData of testImages) {
      this.db.insertImage(imageData);
    }
    
    this.db.insertCrawlSession({
      pages_crawled: 5,
      unique_domains: 3,
      total_images: testImages.length
    });
    
    console.log(`✅ 創建了 ${testImages.length} 個測試圖像記錄`);
  }
}

module.exports = ImageCleaner;