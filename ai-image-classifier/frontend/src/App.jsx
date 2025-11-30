import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';

function App() {
  const [hasSportsActivity, setHasSportsActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef();

  // 擴展運動關鍵字 - 包含更多 Google AI 常用的詞彙
  const sportsKeywords = [
    // 運動人物
    'player', 'athlete', 'sportsman', 'sportswoman',
    'runner', 'swimmer', 'cyclist', 'skater', 'boxer',
    'gymnast', 'weightlifter', 'climber', 'diver',
    'goalkeeper', 'pitcher', 'batter', 'forward', 'defender',
    
    // 運動動作
    'running', 'jumping', 'swimming', 'cycling', 'skating',
    'boxing', 'lifting', 'climbing', 'diving', 'throwing',
    'kicking', 'hitting', 'sprinting', 'jogging',
    
    // 具體運動項目
    'basketball', 'soccer', 'football', 'tennis', 'baseball',
    'volleyball', 'cricket', 'rugby', 'hockey', 'golf',
    'skiing', 'snowboarding', 'surfing', 'wrestling',
    
    // 運動相關
    'sports', 'game', 'match', 'stadium', 'court', 'field',
    'pool', 'track', 'gym', 'arena'
  ];

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
    } catch (error) {
      console.error('模型載入失敗:', error);
    }
  };

  const detectSports = async (file) => {
    if (!model) return;

    setLoading(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const predictions = await model.classify(img);
      
      // 在後台打印分析結果（開發者可以看到）
      console.log('🔍 AI 分析結果:', predictions);
      
      const hasSports = checkForSportsActivity(predictions);
      setHasSportsActivity(hasSports);
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.error('檢測失敗:', error);
    }
    setLoading(false);
  };

  const checkForSportsActivity = (predictions) => {
    let sportsScore = 0;
    
    predictions.forEach(pred => {
      const className = pred.className.toLowerCase();
      const confidence = pred.probability;
      
      // 檢查每個關鍵字
      sportsKeywords.forEach(keyword => {
        if (className.includes(keyword.toLowerCase())) {
          // 根據信心度累計分數
          sportsScore += confidence;
          console.log(`✅ 匹配: ${keyword} (${className}) - ${(confidence * 100).toFixed(1)}%`);
        }
      });
    });
    
    console.log(`📊 運動總分: ${sportsScore.toFixed(2)}`);
    
    // 調整閾值：如果有明顯的運動特徵就認為有運動
    return sportsScore > 0.2;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setHasSportsActivity(null);
      detectSports(file);
    }
  };

  return (
    <div className="app">
      <h1>🏃‍♂️ 運動檢測器</h1>
      <p>上傳圖片檢測是否有人正在運動</p>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={!model || loading}
          className="upload-button"
        >
          {loading ? '🔄 分析中...' : '📷 選擇圖片'}
        </button>
      </div>

      {previewUrl && (
        <div className="preview-section">
          <img src={previewUrl} alt="預覽" className="preview-image" />
        </div>
      )}

      {hasSportsActivity !== null && (
        <div className="simple-result">
          {hasSportsActivity ? (
            <div className="result-yes">
              <div className="result-icon">✅</div>
              <div className="result-text">
                <h2>有人正在運動</h2>
              </div>
            </div>
          ) : (
            <div className="result-no">
              <div className="result-icon">❌</div>
              <div className="result-text">
                <h2>沒有人正在運動</h2>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;