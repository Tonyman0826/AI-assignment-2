const express = require('express');
const path = require('path');
const fs = require('fs-extra');

class AdminServer {
  constructor(dbManager, labelManager, modelTrainer, port = 3001) {
    this.app = express();
    this.db = dbManager;
    this.labelManager = labelManager;
    this.modelTrainer = modelTrainer;
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../admin')));
    
    // 修復：正確設置靜態文件服務
    this.app.use('/data/raw', express.static(path.join(process.cwd(), 'data/raw')));
    this.app.use('/data/cleaned', express.static(path.join(process.cwd(), 'data/cleaned')));
  }

  setupRoutes() {
    // 獲取未標記的圖片 - 支持分頁和統計
    this.app.get('/api/unlabeled-images', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 24;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        console.log(`📄 分頁請求: page=${page}, limit=${limit}`);
        
        // 獲取所有未標記圖片
        const allUnlabeled = await this.labelManager.getUnlabeledImages(10000);
        const total = allUnlabeled.length;
        const labeledCount = this.labelManager.labeledData.length;
        
        console.log(`📊 分頁統計: 總數=${total}, 已標記=${labeledCount}, 未標記=${allUnlabeled.length}`);
        
        // 分頁處理
        const paginatedImages = allUnlabeled.slice(skip, skip + limit);
        
        // 為每個圖片添加正確的URL路徑
        const imagesWithUrls = paginatedImages.map(image => ({
          ...image,
          image_url: `/data/raw/${path.basename(image.file_path)}`,
          display_name: path.basename(image.file_path),
          file_name: path.basename(image.file_path)
        }));
        
        const response = {
          images: imagesWithUrls,
          total: total,
          labeledCount: labeledCount,
          page: page,
          totalPages: Math.ceil(total / limit),
          limit: limit
        };
        
        console.log(`✅ 返回: ${imagesWithUrls.length} 張圖片, 總頁數: ${response.totalPages}`);
        res.json(response);
        
      } catch (error) {
        console.error('❌ 獲取未標記圖片失敗:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 標記圖片
    this.app.post('/api/label-image', async (req, res) => {
      try {
        console.log('📝 收到標記請求:', req.body);
        
        const { imagePath, sportType } = req.body;
        
        if (!imagePath || !sportType) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少必要參數: imagePath 或 sportType' 
          });
        }
        
        const result = await this.labelManager.addLabel(imagePath, sportType);
        
        console.log('✅ 標記成功:', result);
        res.json({ 
          success: true,
          labeledCount: result.labeledCount,
          message: `成功標記為: ${sportType}`
        });
        
      } catch (error) {
        console.error('❌ 標記失敗:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // 開始訓練
    this.app.post('/api/train-model', async (req, res) => {
      try {
        const { epochs = 10 } = req.body;
        const history = await this.modelTrainer.trainModel(epochs);
        res.json({ success: true, history: history.history });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 獲取統計數據
    this.app.get('/api/stats', async (req, res) => {
      try {
        const labeledStats = this.labelManager.getLabeledStats();
        const dbStats = this.db.getAllData();
        const totalImages = dbStats.images.length;
        const cleanedImages = dbStats.images.filter(img => img.is_cleaned).length;
        const totalLabeled = this.labelManager.labeledData.length;
        
        res.json({
          labeled: labeledStats,
          totalLabeled: totalLabeled,
          totalImages: totalImages,
          cleanedImages: cleanedImages,
          progress: totalImages > 0 ? (totalLabeled / totalImages) * 100 : 0
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 測試圖片路徑
    this.app.get('/api/test-images', async (req, res) => {
      try {
        const rawDir = './data/raw';
        const files = await fs.readdir(rawDir);
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
        }).slice(0, 5);
        
        res.json({
          message: `找到 ${imageFiles.length} 個圖片文件`,
          images: imageFiles.map(file => ({
            name: file,
            url: `/data/raw/${file}`,
            fullPath: path.join(process.cwd(), 'data/raw', file)
          }))
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 批量標記
    this.app.post('/api/batch-label', async (req, res) => {
      try {
        const { imagePaths, sportType } = req.body;
        
        if (!imagePaths || !sportType) {
          return res.status(400).json({ 
            success: false, 
            error: '缺少必要參數' 
          });
        }
        
        const results = [];
        for (const imagePath of imagePaths) {
          try {
            const result = await this.labelManager.addLabel(imagePath, sportType);
            results.push({ imagePath, success: true });
          } catch (error) {
            results.push({ imagePath, success: false, error: error.message });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        res.json({ 
          success: true, 
          results: results,
          message: `成功標記 ${successCount} 張圖片為 ${sportType}`
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 主頁面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../admin/index.html'));
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🎛️  後台管理界面運行在: http://localhost:${this.port}`);
      console.log('功能包括:');
      console.log('  - 圖片標記和分類');
      console.log('  - 模型訓練');
      console.log('  - 數據統計');
      console.log('  - 批量標記');
      console.log('  - 測試圖片路徑: http://localhost:3001/api/test-images');
    });
  }
}

module.exports = AdminServer;