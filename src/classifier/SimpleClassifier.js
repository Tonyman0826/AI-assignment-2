const path = require('path');

class SimpleClassifier {
  constructor() {
    this.sportTypes = [
      'basketball', 'soccer', 'tennis', 'baseball', 'volleyball',
      'swimming', 'running', 'gymnastics', 'boxing', 'cycling',
      'unknown'
    ];
  }
  
  async loadModel() {
    console.log('✅ 簡單分類器初始化完成（基於文件名）');
  }
  
  async classifyImage(imagePath) {
    try {
      const fileName = path.basename(imagePath).toLowerCase();
      
      // 基於文件名的簡單分類
      const isSports = this.isLikelySports(fileName);
      const sportType = this.detectSportType(fileName);
      const confidence = this.calculateConfidence(fileName);
      
      return {
        isSports: isSports,
        confidence: confidence,
        method: 'filename-based',
        sportType: sportType,
        fileName: fileName
      };
      
    } catch (error) {
      console.log(`❌ 分類失敗 ${path.basename(imagePath)}: ${error.message}`);
      return {
        isSports: true, // 默認保留，避免刪除太多
        confidence: 0.5,
        sportType: 'unknown',
        method: 'error-fallback'
      };
    }
  }
  
  isLikelySports(fileName) {
    const sportsKeywords = [
      'sport', 'sports', 'athlete', 'player', 'game', 'match', 'competition',
      'basketball', 'soccer', 'football', 'tennis', 'baseball', 'volleyball',
      'hockey', 'golf', 'swim', 'running', 'run', 'jump', 'olympic',
      'championship', 'tournament', 'training', 'exercise', 'athletic'
    ];
    
    const negativeKeywords = [
      'logo', 'icon', 'badge', 'banner', 'ad', 'advertisement',
      'map', 'diagram', 'chart', 'graph', 'drawing', 'sketch',
      'cartoon', 'animation', 'illustration', 'poster'
    ];
    
    const hasSports = sportsKeywords.some(keyword => fileName.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => fileName.includes(keyword));
    
    // 如果文件名包含運動關鍵詞，且不包含負面關鍵詞，則認為是運動圖片
    return hasSports && !hasNegative;
  }
  
  detectSportType(fileName) {
    const sportKeywords = {
      'basketball': ['basketball', 'nba', 'hoop', 'dunk', 'basket'],
      'soccer': ['soccer', 'football', 'fifa', 'goal', 'stadium', 'soccer'],
      'tennis': ['tennis', 'wimbledon', 'racket', 'court', 'tennis'],
      'baseball': ['baseball', 'mlb', 'bat', 'diamond', 'baseball'],
      'volleyball': ['volleyball', 'spike', 'net', 'volley'],
      'swimming': ['swim', 'pool', 'diving', 'water', 'swimmer'],
      'running': ['run', 'marathon', 'sprint', 'track', 'runner'],
      'gymnastics': ['gymnastics', 'gym', 'balance', 'floor'],
      'boxing': ['boxing', 'box', 'ring', 'glove', 'fighter'],
      'cycling': ['cycling', 'bike', 'bicycle', 'tour', 'cyclist']
    };
    
    for (const [sport, keywords] of Object.entries(sportKeywords)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return sport;
      }
    }
    
    return 'unknown';
  }
  
  calculateConfidence(fileName) {
    let score = 0;
    
    // 文件名長度（較長的文件名可能包含更多信息）
    if (fileName.length > 10) score += 1;
    
    // 包含數字（可能是序列化的圖片）
    if (/\d/.test(fileName)) score += 1;
    
    // 包含常見圖片後綴
    if (fileName.includes('img') || fileName.includes('image') || fileName.includes('pic')) score += 1;
    
    // 包含運動相關詞彙
    if (this.isLikelySports(fileName)) score += 2;
    
    return Math.min(score / 5, 0.9); // 轉換為0-0.9的置信度
  }
}

module.exports = SimpleClassifier;