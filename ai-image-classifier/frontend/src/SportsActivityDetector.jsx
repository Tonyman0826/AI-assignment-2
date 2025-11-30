import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';

function SportsActivityDetector() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef();

  // 運動活動檢測規則
  const sportsActivityRules = {
    // 人物相關
    personKeywords: [
      'person', 'people', 'man', 'woman', 'child', 'baby', 'human',
      'athlete', 'player', 'sportsman', 'sportswoman'
    ],
    
    // 運動動作相關
    actionKeywords: [
      'running', 'jumping', 'swimming', 'throwing', 'kicking', 'hitting',
      'diving', 'cycling', 'skating', 'skiing', 'climbing', 'lifting'
    ],
    
    // 運動場景相關
    sceneKeywords: [
      'sports', 'game', 'match', 'competition', 'stadium', 'court',
      'field', 'pool', 'track', 'gym', 'arena'
    ],
    
    // 運動裝備相關
    equipmentKeywords: [
      'ball', 'racket', 'bat', 'goal', 'hoop', 'net', 'pool',
      'bicycle', 'skate', 'ski', 'weights', 'dumbbell'
    ],
    
    // 具體運動項目
    specificSports: [
      'basketball', 'soccer', 'football', 'tennis', 'baseball',
      'volleyball', 'swimming', 'running', 'cycling', 'skiing',
      'skating', 'gymnastics', 'weightlifting', 'boxing', 'martial'
    ]
  };

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
      console.log('✅ 運動檢測模型載入成功');
    } catch (error) {
      console.error('❌ 模型載入失敗:', error);
    }
  };

  const detectSportsActivity = async (file) => {
    if (!model) return;

    setLoading(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 使用 MobileNet 進行分類
      const predictions = await model.classify(img);
      
      // 分析是否包含運動活動
      const activityAnalysis = analyzeSportsActivity(predictions);
      
      setResult(activityAnalysis);
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.error('檢測失敗:', error);
    }
    setLoading(false);
  };

  const analyzeSportsActivity = (predictions) => {
    let score = 0;
    const evidences = [];
    const matchedItems = [];

    // 分析每個預測結果
    predictions.forEach(pred => {
      const className = pred.className.toLowerCase();
      const confidence = pred.probability;

      // 檢查人物
      if (sportsActivityRules.personKeywords.some(keyword => className.includes(keyword))) {
        score += confidence * 30; // 人物權重較高
        evidences.push(`發現人物 (${(confidence * 100).toFixed(1)}%)`);
        matchedItems.push(className);
      }

      // 檢查運動動作
      if (sportsActivityRules.actionKeywords.some(keyword => className.includes(keyword))) {
        score += confidence * 40; // 動作權重最高
        evidences.push(`運動動作: ${className} (${(confidence * 100).toFixed(1)}%)`);
        matchedItems.push(className);
      }

      // 檢查具體運動項目
      if (sportsActivityRules.specificSports.some(keyword => className.includes(keyword))) {
        score += confidence * 35;
        evidences.push(`運動項目: ${className} (${(confidence * 100).toFixed(1)}%)`);
        matchedItems.push(className);
      }

      // 檢查運動場景
      if (sportsActivityRules.sceneKeywords.some(keyword => className.includes(keyword))) {
        score += confidence * 25;
        evidences.push(`運動場景: ${className} (${(confidence * 100).toFixed(1)}%)`);
        matchedItems.push(className);
      }

      // 檢查運動裝備
      if (sportsActivityRules.equipmentKeywords.some(keyword => className.includes(keyword))) {
        score += confidence * 20;
        evidences.push(`運動裝備: ${className} (${(confidence * 100).toFixed(1)}%)`);
        matchedItems.push(className);
      }
    });

    // 決定結果
    let activityLevel, description, color;
    
    if (score >= 60) {
      activityLevel = 'high';
      description = '✅ 明確的運動活動';
      color = '#28a745';
    } else if (score >= 30) {
      activityLevel = 'medium';
      description = '⚠️ 可能的運動活動';
      color = '#ffc107';
    } else if (score >= 15) {
      activityLevel = 'low';
      description = '❓ 輕微運動跡象';
      color = '#fd7e14';
    } else {
      activityLevel = 'none';
      description = '❌ 未檢測到運動活動';
      color = '#dc3545';
    }

    return {
      score: Math.min(Math.round(score), 100),
      activityLevel,
      description,
      color,
      evidences,
      matchedItems: [...new Set(matchedItems)], // 去重
      rawPredictions: predictions.slice(0, 5)
    };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      detectSportsActivity(file);
    }
  };

  const getActivityIcon = (level) => {
    switch(level) {
      case 'high': return '🏃‍♂️✅';
      case 'medium': return '🚶‍♂️⚠️';
      case 'low': return '🧍‍♂️❓';
      default: return '🚫❌';
    }
  };

  return (
    <div className="app">
      <h1>🎯 運動活動檢測器</h1>
      <p>AI 自動判斷圖片中是否有人在進行運動</p>
      
      <div className="model-status">
        {model ? (
          <div className="status ready">✅ 檢測模型已就緒</div>
        ) : (
          <div className="status loading">🔄 載入模型中...</div>
        )}
      </div>

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
          {loading ? '🔄 檢測中...' : '📷 上傳圖片檢測'}
        </button>
      </div>

      {previewUrl && (
        <div className="preview-section">
          <h3>圖片預覽:</h3>
          <img src={previewUrl} alt="預覽" className="preview-image" />
        </div>
      )}

      {result && (
        <div className="result-section">
          <div 
            className="activity-result"
            style={{ borderLeftColor: result.color, background: `${result.color}15` }}
          >
            <div className="activity-header">
              <span className="activity-icon" style={{ fontSize: '2em' }}>
                {getActivityIcon(result.activityLevel)}
              </span>
              <div className="activity-text">
                <h3 style={{ color: result.color, margin: 0 }}>
                  {result.description}
                </h3>
                <div className="activity-score">
                  運動指數: <strong>{result.score}/100</strong>
                </div>
              </div>
            </div>

            {/* 運動指數條 */}
            <div className="score-bar-container">
              <div 
                className="score-bar-fill"
                style={{ 
                  width: `${result.score}%`,
                  background: result.color
                }}
              />
              <div className="score-labels">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* 檢測證據 */}
            {result.evidences.length > 0 && (
              <div className="evidences">
                <h4>🔍 檢測依據:</h4>
                <ul>
                  {result.evidences.map((evidence, index) => (
                    <li key={index}>{evidence}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 匹配項目 */}
            {result.matchedItems.length > 0 && (
              <div className="matched-items">
                <h4>🎯 識別內容:</h4>
                <div className="tags">
                  {result.matchedItems.map((item, index) => (
                    <span key={index} className="tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 原始識別結果 */}
            <details className="raw-predictions">
              <summary>📊 AI 原始識別結果</summary>
              <div className="predictions-list">
                {result.rawPredictions.map((pred, index) => (
                  <div key={index} className="prediction-item">
                    <span>{pred.className}</span>
                    <span>{(pred.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>ℹ️ 檢測標準說明</h3>
        <div className="detection-criteria">
          <div className="criterion">
            <span className="criterion-icon">🏃‍♂️</span>
            <div>
              <strong>運動動作</strong>
              <br />
              跑步、跳躍、游泳等
            </div>
          </div>
          <div className="criterion">
            <span className="criterion-icon">👥</span>
            <div>
              <strong>人物檢測</strong>
              <br />
              圖片中是否有人物
            </div>
          </div>
          <div className="criterion">
            <span className="criterion-icon">🎯</span>
            <div>
              <strong>運動項目</strong>
              <br />
              籃球、足球、網球等
            </div>
          </div>
          <div className="criterion">
            <span className="criterion-icon">🏟️</span>
            <div>
              <strong>運動場景</strong>
              <br />
              球場、游泳池、體育館
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SportsActivityDetector;