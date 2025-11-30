import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setPrediction(null)
    }
  }

  const handlePredict = async () => {
    if (!selectedFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      // 直接連接到後端
      const response = await axios.post('http://localhost:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setPrediction(response.data)
    } catch (error) {
      console.error('預測失敗:', error)
      alert('預測失敗: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>AI 圖片分類器</h1>
      <p>上傳運動圖片，AI 會自動分類</p>
      
      <div className="upload-section">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileSelect}
        />
        <button 
          onClick={handlePredict} 
          disabled={!selectedFile || loading}
        >
          {loading ? '分析中...' : '開始分類'}
        </button>
      </div>

      {previewUrl && (
        <div className="preview-section">
          <h3>圖片預覽:</h3>
          <img src={previewUrl} alt="預覽" className="preview-image" />
        </div>
      )}

      {prediction && (
        <div className="result-section">
          <h3>預測結果:</h3>
          <div className="prediction-card">
            <h4>主要類別: {prediction.category}</h4>
            <p>信心度: {(prediction.confidence * 100).toFixed(2)}%</p>
            {prediction.message && <p className="message">{prediction.message}</p>}
            
            <div className="all-predictions">
              <h5>所有類別機率:</h5>
              {Object.entries(prediction.all_predictions).map(([category, prob]) => (
                <div key={category} className="probability-bar">
                  <span>{category}:</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ width: `${prob * 100}%` }}
                    ></div>
                    <span className="percentage">{(prob * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App