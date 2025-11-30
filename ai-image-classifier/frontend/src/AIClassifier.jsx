import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

function AIClassifier() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const fileInputRef = useRef();

  // 載入模型
  const loadModel = async () => {
    setLoading(true);
    try {
      console.log('載入 MobileNet 模型...');
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
      console.log('模型載入成功');
    } catch (error) {
      console.error('模型載入失敗:', error);
    }
    setLoading(false);
  };

  // 分類圖片
  const classifyImage = async (file) => {
    if (!model) {
      alert('請先載入模型');
      return;
    }

    setLoading(true);
    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      
      img.onload = async () => {
        // 使用 MobileNet 進行分類
        const predictions = await model.classify(img);
        
        // 過濾出運動相關的結果
        const sportsPredictions = predictions.filter(pred => 
          pred.className.toLowerCase().includes('sports') ||
          pred.className.toLowerCase().includes('ball') ||
          pred.className.toLowerCase().includes('game') ||
          pred.className.toLowerCase().includes('athlete') ||
          pred.className.toLowerCase().includes('soccer') ||
          pred.className.toLowerCase().includes('basketball') ||
          pred.className.toLowerCase().includes('tennis') ||
          pred.className.toLowerCase().includes('swimming') ||
          pred.className.toLowerCase().includes('running') ||
          pred.className.toLowerCase().includes('cycling')
        );
        
        setPredictions(sportsPredictions.length > 0 ? sportsPredictions : predictions.slice(0, 3));
        URL.revokeObjectURL(img.src);
      };
      
    } catch (error) {
      console.error('分類失敗:', error);
      alert('分類失敗: ' + error.message);
    }
    setLoading(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      classifyImage(file);
    }
  };

  // 運動類別映射
  const sportsCategories = {
    'basketball': '籃球',
    'soccer': '足球', 
    'tennis': '網球',
    'swimming': '游泳',
    'running': '跑步',
    'cycling': '自行車',
    'sports': '運動'
  };

  const translateCategory = (className) => {
    const lowerClass = className.toLowerCase();
    for (const [eng, chi] of Object.entries(sportsCategories)) {
      if (lowerClass.includes(eng)) {
        return chi;
      }
    }
    return className;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎯 AI 圖片分類器 (使用 MobileNet)</h1>
      <p>使用 Google 預訓練模型，準確度更高</p>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={loadModel} 
          disabled={loading || model}
          style={{ padding: '10px 20px', marginRight: '10px' }}
        >
          {model ? '✅ 模型已載入' : loading ? '載入中...' : '載入 AI 模型'}
        </button>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={!model || loading}
          ref={fileInputRef}
          style={{ padding: '10px' }}
        />
      </div>

      {loading && <p>🔄 AI 分析中...</p>}

      {predictions.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>🔍 AI 分析結果:</h3>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
            {predictions.map((pred, index) => (
              <div key={index} style={{ margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {translateCategory(pred.className)}
                  </span>
                  <span style={{ color: '#007bff' }}>
                    {(pred.probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div 
                  style={{
                    height: '20px',
                    background: '#007bff',
                    width: `${pred.probability * 100}%`,
                    borderRadius: '4px',
                    marginTop: '5px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', background: '#e9ecef', borderRadius: '5px' }}>
        <h4>ℹ️ 使用說明:</h4>
        <ul>
          <li>1. 點擊"載入 AI 模型" (只需一次)</li>
          <li>2. 選擇運動圖片上傳</li>
          <li>3. 查看 AI 分析結果</li>
          <li>✅ 使用 Google 預訓練模型，準確度更高</li>
          <li>✅ 支援 1000+ 種物體分類</li>
          <li>✅ 自動過濾運動相關結果</li>
        </ul>
      </div>
    </div>
  );
}

export default AIClassifier;