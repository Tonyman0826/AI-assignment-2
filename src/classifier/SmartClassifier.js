const path = require('path');
const fs = require('fs-extra');

class SmartClassifier {
  constructor(labelManager, modelTrainer) {
    this.labelManager = labelManager;
    this.modelTrainer = modelTrainer;
    this.trainedModel = null;
    this.isTrained = false;
  }

  async initialize() {
    console.log('🧠 初始化智能分類器...');
    
    // 嘗試加載已訓練的模型
    const modelLoaded = await this.modelTrainer.loadModel();
    if (modelLoaded) {
      this.trainedModel = this.modelTrainer.model;
      this.isTrained = true;
      console.log('✅ 智能分類器加載完成（使用訓練模型）');
    } else {
      console.log('ℹ️ 智能分類器使用基礎規則');
    }
  }

  async classifyImage(imagePath) {
    try {
      const fileName = path.basename(imagePath).toLowerCase();
      
      // 1. 首先檢查是否有手動標記
      const manualLabel = this.getManualLabel(imagePath);
      if (manualLabel) {
        return {
          isSports: true,
          confidence: 0.95,
          method: 'manual-label',
          sportType: manualLabel,
          fileName: fileName
        };
      }

      // 2. 使用訓練的模型（如果可用）
      if (this.isTrained && this.trainedModel) {
        const modelResult = this.modelTrainer.classifyImage(imagePath, fileName);
        if (modelResult.confidence > 0.7) {
          return {
            isSports: true,
            confidence: modelResult.confidence,
            method: 'trained-model',
            sportType: modelResult.sportType,
            fileName: fileName
          };
        }
      }

      // 3. 使用學習到的模式
      const learnedResult = this.learnedClassification(fileName);
      if (learnedResult.confidence > 0.6) {
        return {
          isSports: true,
          confidence: learnedResult.confidence,
          method: 'learned-patterns',
          sportType: learnedResult.sportType,
          fileName: fileName
        };
      }

      // 4. 使用基礎規則
      const baseResult = this.baseClassification(fileName);
      return {
        isSports: baseResult.isSports,
        confidence: baseResult.confidence,
        method: 'base-rules',
        sportType: baseResult.sportType,
        fileName: fileName
      };

    } catch (error) {
      console.log(`❌ 智能分類失敗 ${path.basename(imagePath)}: ${error.message}`);
      return {
        isSports: true, // 默認保留
        confidence: 0.5,
        sportType: 'unknown',
        method: 'error-fallback'
      };
    }
  }

  // 獲取手動標記
  getManualLabel(imagePath) {
    const labeledData = this.labelManager.labeledData;
    const normalizedPath = `./data/raw/${path.basename(imagePath)}`;
    
    const manualLabel = labeledData.find(item => 
      item.imagePath === normalizedPath || 
      item.imagePath === imagePath
    );
    
    return manualLabel ? manualLabel.sportType : null;
  }

  // 學習到的模式分類
  learnedClassification(fileName) {
    const labeledData = this.labelManager.labeledData;
    
    // 分析已標記數據中的模式
    const patterns = this.analyzeLabeledPatterns(labeledData);
    
    // 檢查文件名是否匹配已知模式
    for (const [sport, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return {
          sportType: sport,
          confidence: 0.8,
          patterns: keywords
        };
      }
    }

    return {
      sportType: 'unknown',
      confidence: 0.3,
      patterns: []
    };
  }

  // 分析已標記數據中的模式
  analyzeLabeledPatterns(labeledData) {
    const patterns = {
      basketball: new Set(['basketball', 'nba', 'hoop']),
      soccer: new Set(['soccer', 'football', 'fifa']),
      tennis: new Set(['tennis', 'wimbledon']),
      baseball: new Set(['baseball', 'mlb']),
      swimming: new Set(['swim', 'pool']),
      running: new Set(['run', 'marathon'])
    };

    // 從已標記數據中學習新關鍵詞
    labeledData.forEach(item => {
      const fileName = path.basename(item.imagePath).toLowerCase();
      const sport = item.sportType;
      
      if (patterns[sport]) {
        // 提取文件名中的可能關鍵詞
        const words = fileName.split(/[_.-]/);
        words.forEach(word => {
          if (word.length > 3 && !this.isCommonWord(word)) {
            patterns[sport].add(word);
          }
        });
      }
    });

    // 轉換為數組並過濾
    const result = {};
    for (const [sport, keywordSet] of Object.entries(patterns)) {
      result[sport] = Array.from(keywordSet).filter(keyword => 
        keyword.length > 2 && !this.isCommonWord(keyword)
      );
    }

    console.log('🎓 學習到的模式:', result);
    return result;
  }

  // 基礎規則分類
  baseClassification(fileName) {
    const sportsKeywords = {
      basketball: ['basketball', 'nba', 'hoop', 'dunk', 'basket'],
      soccer: ['soccer', 'football', 'fifa', 'goal', 'stadium'],
      tennis: ['tennis', 'wimbledon', 'racket', 'court'],
      baseball: ['baseball', 'mlb', 'bat', 'diamond'],
      swimming: ['swim', 'pool', 'water', 'diving'],
      running: ['run', 'marathon', 'sprint', 'track']
    };

    const negativeKeywords = [
      'logo', 'icon', 'badge', 'banner', 'ad', 'advertisement',
      'map', 'diagram', 'chart', 'graph', 'drawing', 'sketch',
      'cartoon', 'animation', 'illustration', 'poster'
    ];

    // 檢查負面關鍵詞
    const hasNegative = negativeKeywords.some(keyword => fileName.includes(keyword));
    if (hasNegative) {
      return {
        isSports: false,
        confidence: 0.8,
        sportType: 'non-sports'
      };
    }

    // 檢查運動關鍵詞
    for (const [sport, keywords] of Object.entries(sportsKeywords)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return {
          isSports: true,
          confidence: 0.7,
          sportType: sport
        };
      }
    }

    // 默認認為是運動圖片（避免刪除太多）
    return {
      isSports: true,
      confidence: 0.5,
      sportType: 'other'
    };
  }

  isCommonWord(word) {
    const commonWords = [
      'image', 'img', 'pic', 'photo', 'picture', 'jpg', 'jpeg', 'png',
      'file', 'data', 'raw', 'clean', 'sport', 'sports', 'player'
    ];
    return commonWords.includes(word);
  }

  // 獲取分類器狀態
  getStatus() {
    const labeledCount = this.labelManager.labeledData.length;
    const learningProgress = this.calculateLearningProgress();
    
    return {
      isTrained: this.isTrained,
      labeledDataCount: labeledCount,
      learningProgress: learningProgress,
      method: this.isTrained ? 'trained-model' : 'rule-based',
      confidence: this.isTrained ? 0.8 : 0.6
    };
  }

  calculateLearningProgress() {
    const labeledCount = this.labelManager.labeledData.length;
    if (labeledCount >= 100) return 'expert';
    if (labeledCount >= 50) return 'advanced';
    if (labeledCount >= 20) return 'intermediate';
    if (labeledCount >= 10) return 'beginner';
    return 'novice';
  }
}

module.exports = SmartClassifier;