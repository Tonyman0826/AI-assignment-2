import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';

function SimpleSportsDetector() {
  const [hasSportsActivity, setHasSportsActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef();

  // 運動人物關鍵字
  const sportsPersonKeywords = [
    'player', 'athlete', 'sportsman', 'sportswoman',
    'runner', 'swimmer', 'cyclist', 'skater', 'boxer',
    'gymnast', 'weightlifter', 'climber', 'diver',
    'goalkeeper', 'pitcher', 'batter', 'forward', 'defender'
  ];

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
      console.log('✅ 模型載入成功');
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

      // Google MobileNet 分析
      const predictions = await model.classify(img);
      
      // 檢查是否有運動人物
      const hasPersonDoingSports = checkForSportsPerson(predictions);
      
      setHasSportsActivity(hasPersonDoingSports);
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.error('檢測失敗:', error);
    }
    setLoading(false);
  };

  const checkForSportsPerson = (predictions) => {
    // 檢查每個預測結果
    for (let pred of predictions) {
      const className = pred.className.toLowerCase();
      
      // 如果有運動人物關鍵字，且信心度夠高
      for (let keyword of sportsPersonKeywords) {
        if (className.includes(keyword) && pred.probability > 0.1) {
          return true;
        }
      }
    }
    return false;
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
      <p>AI 判斷圖片中是否有人正在運動</p>
      
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
                <p>檢測到運動員或人物正在進行體育活動</p>
              </div>
            </div>
          ) : (
            <div className="result-no">
              <div className="result-icon">❌</div>
              <div className="result-text">
                <h2>沒有人正在運動</h2>
                <p>未檢測到明顯的運動活動</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="info-section">
        <h3>ℹ️ 檢測說明</h3>
        <p>系統使用 Google AI 分析圖片，自動判斷是否有人正在進行運動</p>
      </div>
    </div>
  );
}

export default SimpleSportsDetector;