const tf = require('@tensorflow/tfjs');
const Jimp = require('jimp');
const path = require('path');

class SportsClassifier {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
    this.sportTypes = [
      'basketball', 'soccer', 'tennis', 'baseball', 'volleyball',
      'swimming', 'running', 'gymnastics', 'boxing', 'cycling',
      'unknown'
    ];
  }
  
  async loadModel() {
    try {
      console.log('🔄 創建簡單的圖像特徵提取模型...');
      
      // 創建一個簡單的CNN模型來提取特徵
      this.model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 16,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dense({ units: this.sportTypes.length, activation: 'softmax' })
        ]
      });
      
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      this.modelLoaded = true;
      console.log('✅ TensorFlow.js 模型創建完成');
    } catch (error) {
      console.log('ℹ️ 使用規則基礎分類模式:', error.message);
      this.modelLoaded = false;
    }
  }
  
  async classifyImage(imagePath) {
    try {
      const image = await Jimp.read(imagePath);
      const { width, height } = image.bitmap;
      
      // 基於規則的分類
      const features = await this.analyzeImageFeatures(image, imagePath);
      const isSports = this.decideIfSports(features);
      const sportType = this.detectSportType(features, imagePath);
      
      return {
        isSports: isSports,
        confidence: isSports ? 0.85 : 0.75,
        method: 'rule-based',
        sportType: sportType,
        features: features
      };
      
    } catch (error) {
      console.log(`❌ 圖像分類失敗 ${path.basename(imagePath)}: ${error.message}`);
      return {
        isSports: false,
        confidence: 0.5,
        sportType: 'unknown',
        method: 'error-fallback'
      };
    }
  }
  
  async analyzeImageFeatures(image, imagePath) {
    const { width, height } = image.bitmap;
    const colorAnalysis = await this.analyzeColors(image);
    const fileName = path.basename(imagePath).toLowerCase();
    
    return {
      aspectRatio: width / height,
      fileSize: image.bitmap.data.length,
      width: width,
      height: height,
      isColorful: colorAnalysis.isColorful,
      colorCount: colorAnalysis.colorCount,
      fileName: fileName,
      hasSportsKeywords: this.hasSportsKeywords(fileName),
      isGoodSize: width >= 200 && height >= 200,
      dominantColors: colorAnalysis.dominantColors
    };
  }
  
  async analyzeColors(image) {
    const colors = new Map();
    let totalPixels = 0;
    
    // 採樣分析顏色
    const sampleRate = 5;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      if (x % sampleRate === 0 && y % sampleRate === 0) {
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const colorKey = `${Math.round(r/20)*20},${Math.round(g/20)*20},${Math.round(b/20)*20}`;
        
        colors.set(colorKey, (colors.get(colorKey) || 0) + 1);
        totalPixels++;
      }
    });
    
    // 找出主要顏色
    const sortedColors = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    return {
      isColorful: colors.size > 30,
      colorCount: colors.size,
      totalPixels: totalPixels,
      dominantColors: sortedColors.map(([color, count]) => ({ color, percentage: (count / totalPixels) * 100 }))
    };
  }
  
  hasSportsKeywords(fileName) {
    const sportsKeywords = [
      'sport', 'sports', 'athlete', 'player', 'game', 'match', 'competition',
      'basketball', 'soccer', 'football', 'tennis', 'baseball', 'volleyball',
      'hockey', 'golf', 'swim', 'running', 'run', 'jump', 'olympic',
      'championship', 'tournament', 'training', 'exercise'
    ];
    
    const negativeKeywords = [
      'logo', 'icon', 'badge', 'banner', 'ad', 'advertisement',
      'map', 'diagram', 'chart', 'graph', 'drawing', 'sketch',
      'cartoon', 'animation', 'illustration', 'poster'
    ];
    
    const hasSports = sportsKeywords.some(keyword => fileName.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => fileName.includes(keyword));
    
    return hasSports && !hasNegative;
  }
  
  detectSportType(features, imagePath) {
    const fileName = path.basename(imagePath).toLowerCase();
    const sportKeywords = {
      'basketball': ['basketball', 'nba', 'hoop', 'dunk'],
      'soccer': ['soccer', 'football', 'fifa', 'goal', 'stadium'],
      'tennis': ['tennis', 'wimbledon', 'racket', 'court'],
      'baseball': ['baseball', 'mlb', 'bat', 'diamond'],
      'volleyball': ['volleyball', 'spike', 'net'],
      'swimming': ['swim', 'pool', 'diving', 'water'],
      'running': ['run', 'marathon', 'sprint', 'track'],
      'gymnastics': ['gymnastics', 'gym', 'balance', 'floor'],
      'boxing': ['boxing', 'box', 'ring', 'glove'],
      'cycling': ['cycling', 'bike', 'bicycle', 'tour']
    };
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return sport;
      }
    }
    
    // 基於顏色特徵的簡單推測
    if (features.dominantColors.some(color => {
      const [r, g, b] = color.color.split(',').map(Number);
      // 綠色可能表示足球場、網球場
      return g > r && g > b && g > 100;
    })) {
      return Math.random() > 0.5 ? 'soccer' : 'tennis';
    }
    
    // 藍色可能表示游泳
    if (features.dominantColors.some(color => {
      const [r, g, b] = color.color.split(',').map(Number);
      return b > r && b > g && b > 100;
    })) {
      return 'swimming';
    }
    
    return 'unknown';
  }
  
  decideIfSports(features) {
    let score = 0;
    
    // 放寬標準，避免刪除太多圖片
    if (features.isGoodSize) score += 1;
    if (features.isColorful) score += 1;  
    if (features.hasSportsKeywords) score += 2;
    if (features.aspectRatio > 0.6 && features.aspectRatio < 1.8) score += 1;
    if (features.fileSize > 30000) score += 1;
    
    return score >= 3;
  }
}

module.exports = SportsClassifier;