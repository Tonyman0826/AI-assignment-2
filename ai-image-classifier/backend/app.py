import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from flask import Flask, request, jsonify, render_template
import matplotlib.pyplot as plt

app = Flask(__name__)

# 定義運動類別
categories = ["籃球", "足球", "網球", "游泳", "跑步", "自行車"]

# 載入模型函數
def load_model():
    try:
        # 新版本 TensorFlow 的載入方式
        model = keras.models.load_model('sports_model.h5')
        print("模型載入成功")
        return model
    except Exception as e:
        print(f"模型載入失敗: {e}")
        print("請先訓練模型")
        return None

model = load_model()

# 圖片預處理函數
def preprocess_image(image):
    # 如果收到的是文件路徑
    if isinstance(image, str):
        img = Image.open(image)
    else:
        # 如果收到的是文件對象
        img = Image.open(image.stream)
    
    img = img.resize((150, 150))
    img_array = np.array(img)
    
    # 處理不同通道數的圖片
    if len(img_array.shape) == 2:  # 灰階圖片
        img_array = np.stack([img_array] * 3, axis=-1)
    elif img_array.shape[2] == 4:  # RGBA圖片
        img_array = img_array[:, :, :3]
    
    img_array = img_array / 255.0  # 正規化
    return np.expand_dims(img_array, axis=0)  # 添加批次維度

# 預測路由
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': '沒有上傳圖片'})
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '沒有選擇檔案'})
    
    # 檢查模型是否載入
    if model is None:
        return jsonify({'error': '模型未載入，請先訓練模型'})
    
    # 預處理和預測
    try:
        processed_image = preprocess_image(file)
        predictions = model.predict(processed_image)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        
        result = {
            'category': categories[predicted_idx],
            'confidence': confidence,
            'all_predictions': {
                cat: float(pred) for cat, pred in zip(categories, predictions[0])
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)})

# 主頁路由
@app.route('/')
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI 圖片分類器後端</title>
    </head>
    <body>
        <h1>AI 圖片分類器後端服務</h1>
        <p>後端服務運行中！請使用前端界面進行圖片分類。</p>
        <p>前端應該運行在 <a href="http://localhost:5173">http://localhost:5173</a></p>
    </body>
    </html>
    """

if __name__ == '__main__':
    # 建立必要的資料夾
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True, port=5000)