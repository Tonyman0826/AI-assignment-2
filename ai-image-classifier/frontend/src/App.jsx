import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';

function App() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [modelLoading, setModelLoading] = useState(false);
  const fileInputRef = useRef();

  // 頁面載入時自動載入模型
  useEffect(() => {
    loadModel();
  }, []);

  // 載入 MobileNet 模型
  const loadModel = async () => {
    setModelLoading(true);
    try {
      console.log('🚀 載入 MobileNet AI 模型...');
      // 載入 MobileNet 模型（預訓練在 ImageNet 資料集）
      const loadedModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      setModel(loadedModel);
      console.log('✅ AI 模型載入成功！');
    } catch (error) {
      console.error('❌ 模型載入失敗:', error);
      alert('AI 模型載入失敗，請刷新頁面重試');
    }
    setModelLoading(false);
  };

  // 分類圖片
  const classifyImage = async (file) => {
    if (!model) {
      alert('AI 模型尚未載入完成，請稍候...');
      return;
    }

    setLoading(true);
    try {
      // 建立圖片元素
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      console.log('🔍 AI 開始分析圖片...');
      
      // 使用 MobileNet 進行分類
      const allPredictions = await model.classify(img);
      
      // 過濾和映射運動相關的結果
      const sportsPredictions = allPredictions
        .map(pred => ({
          ...pred,
          translatedName: translateToChinese(pred.className),
          isSports: isSportsRelated(pred.className)
        }))
        .filter(pred => pred.isSports)
        .slice(0, 5); // 只顯示前5個運動相關結果

      // 如果沒有運動相關結果，顯示原始結果
      const finalPredictions = sportsPredictions.length > 0 
        ? sportsPredictions 
        : allPredictions.slice(0, 3).map(pred => ({
            ...pred,
            translatedName: translateToChinese(pred.className),
            isSports: false
          }));

      setPredictions(finalPredictions);
      console.log('✅ AI 分析完成！');
      
      // 清理 URL
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.error('❌ 分類失敗:', error);
      alert('圖片分析失敗: ' + error.message);
    }
    setLoading(false);
  };

  // 運動相關關鍵字映射
  const sportsKeywords = {
    // 籃球相關
    'basketball': '籃球',
    'hoop': '籃框',
    'backboard': '籃板',
    'basketball player': '籃球員',
    
    // 足球相關
    'soccer': '足球',
    'football': '足球',
    'goal': '球門',
    'soccer ball': '足球',
    'soccer player': '足球員',
    
    // 網球相關
    'tennis': '網球',
    'tennis ball': '網球',
    'tennis racket': '網球拍',
    'tennis player': '網球員',
    'tennis court': '網球場',
    
    // 游泳相關
    'swimming': '游泳',
    'swimmer': '游泳選手',
    'swimming pool': '游泳池',
    'swimwear': '泳衣',
    
    // 跑步相關
    'running': '跑步',
    'runner': '跑者',
    'marathon': '馬拉松',
    'sprint': '短跑',
    'jogging': '慢跑',
    
    // 自行車相關
    'bicycle': '自行車',
    'bike': '腳踏車',
    'cycling': '騎自行車',
    'cyclist': '自行車手',
    'mountain bike': '山地車',
    
    // 其他運動
    'sports': '運動',
    'athlete': '運動員',
    'stadium': '體育場',
    'court': '球場',
    'field': '運動場',
    'game': '比賽'
  };

  // 翻譯英文到中文
  const translateToChinese = (englishName) => {
    const lowerName = englishName.toLowerCase();
    
    // 優先檢查完全匹配
    for (const [eng, chi] of Object.entries(sportsKeywords)) {
      if (lowerName === eng.toLowerCase()) {
        return chi;
      }
    }
    
    // 檢查包含關係
    for (const [eng, chi] of Object.entries(sportsKeywords)) {
      if (lowerName.includes(eng.toLowerCase())) {
        return chi;
      }
    }
    
    // 如果沒有匹配，返回原始名稱
    return englishName;
  };

  // 檢查是否與運動相關
  const isSportsRelated = (className) => {
    const lowerName = className.toLowerCase();
    return Object.keys(sportsKeywords).some(keyword => 
      lowerName.includes(keyword.toLowerCase())
    );
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 顯示預覽
      setPreviewUrl(URL.createObjectURL(file));
      setPredictions([]);
      
      // 開始分類
      classifyImage(file);
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app">
      <h1>🎯 AI 圖片運動分類器</h1>
      <p>使用 Google MobileNet 預訓練模型，準確識別運動類型</p>
      
      {/* 模型狀態 */}
      <div className="model-status">
        {modelLoading ? (
          <div className="status loading">🔄 AI 模型載入中...</div>
        ) : model ? (
          <div className="status ready">✅ AI 模型已就緒</div>
        ) : (
          <div className="status error">❌ AI 模型未載入</div>
        )}
      </div>

      {/* 上傳區域 */}
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          onClick={handleSelectClick}
          disabled={!model || loading}
          className="upload-button"
        >
          {loading ? '🔄 分析中...' : '📷 選擇運動圖片'}
        </button>
        
        <div className="upload-hint">
          支援 JPG、PNG 格式，建議使用清晰的運動圖片
        </div>
      </div>

      {/* 圖片預覽 */}
      {previewUrl && (
        <div className="preview-section">
          <h3>圖片預覽:</h3>
          <img src={previewUrl} alt="預覽" className="preview-image" />
        </div>
      )}

      {/* 預測結果 */}
      {predictions.length > 0 && (
        <div className="result-section">
          <h3>🔍 AI 分析結果:</h3>
          <div className="predictions-container">
            {predictions.map((pred, index) => (
              <div key={index} className={`prediction-item ${pred.isSports ? 'sports-related' : ''}`}>
                <div className="prediction-header">
                  <span className="category-name">
                    {pred.translatedName}
                    {pred.isSports && <span className="sports-badge">🏆 運動</span>}
                  </span>
                  <span className="confidence">
                    {(pred.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="bar-fill"
                    style={{ width: `${pred.probability * 100}%` }}
                  />
                </div>
                <div className="original-name">
                  英文: {pred.className}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用說明 */}
      <div className="info-section">
        <h3>ℹ️ 使用說明</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">✅</div>
            <div className="info-text">
              <strong>高準確度</strong>
              <br />
              使用 Google 預訓練模型
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🚀</div>
            <div className="info-text">
              <strong>快速分析</strong>
              <br />
              即時識別運動類型
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <div className="info-text">
              <strong>運動專注</strong>
              <br />
              自動過濾運動相關結果
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🔒</div>
            <div className="info-text">
              <strong>隱私保護</strong>
              <br />
              圖片不上傳，本地分析
            </div>
          </div>
        </div>

        <div className="supported-sports">
          <h4>支援識別的運動類型:</h4>
          <div className="sports-list">
            <span className="sport-tag">🏀 籃球</span>
            <span className="sport-tag">⚽ 足球</span>
            <span className="sport-tag">🎾 網球</span>
            <span className="sport-tag">🏊 游泳</span>
            <span className="sport-tag">🏃 跑步</span>
            <span className="sport-tag">🚴 自行車</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;