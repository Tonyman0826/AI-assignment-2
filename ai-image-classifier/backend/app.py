import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 定義運動類別（必須與訓練時一致）
categories = ["籃球", "足球", "網球", "游泳", "跑步", "自行車"]

# 載入真實訓練的模型
def load_model():
    try:
        model = keras.models.load_model('fixed_sports_model.h5')
        print("✅ 真實 AI 模型載入成功！")
        print(f"📊 可識別類別: {categories}")
        return model
    except Exception as e:
        print(f"❌ 模型載入失敗: {e}")
        print("請先訓練模型：python train_real_model.py")
        return None

model = load_model()

# 圖片預處理函數（必須與訓練時一致）
def preprocess_image(image_file):
    try:
        # 從文件對象讀取圖片
        img = Image.open(image_file.stream)
        img = img.resize((150, 150))  # 與訓練時相同的尺寸
        img_array = np.array(img)
        
        # 處理不同通道數的圖片
        if len(img_array.shape) == 2:  # 灰階圖片
            img_array = np.stack([img_array] * 3, axis=-1)
        elif img_array.shape[2] == 4:  # RGBA圖片
            img_array = img_array[:, :, :3]
        
        img_array = img_array.astype('float32') / 255.0  # 正規化
        return np.expand_dims(img_array, axis=0)  # 添加批次維度
        
    except Exception as e:
        raise Exception(f"圖片預處理失敗: {str(e)}")

# 預測路由
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': '沒有上傳圖片'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '沒有選擇檔案'}), 400
    
    if not file.content_type.startswith('image/'):
        return jsonify({'error': '檔案格式不正確，請上傳圖片'}), 400
    
    # 檢查模型是否載入
    if model is None:
        return jsonify({'error': '模型未載入，請先訓練模型'}), 500
    
    try:
        print(f"🔍 開始分析圖片: {file.filename}")
        
        # 預處理和預測
        processed_image = preprocess_image(file)
        predictions = model.predict(processed_image, verbose=0)
        
        # 取得預測結果
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        
        # 建立所有類別的機率分佈
        all_predictions = {
            category: float(prob) for category, prob in zip(categories, predictions[0])
        }
        
        result = {
            'category': categories[predicted_idx],
            'confidence': confidence,
            'all_predictions': all_predictions,
            'message': '這是真實 AI 模型的預測結果'
        }
        
        print(f"✅ 預測完成: {result['category']} (信心度: {confidence:.2%})")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ 預測錯誤: {e}")
        return jsonify({'error': f'預測失敗: {str(e)}'}), 500

# 模型資訊路由
@app.route('/model-info', methods=['GET'])
def model_info():
    if model is None:
        return jsonify({'error': '模型未載入'})
    
    return jsonify({
        'status': 'loaded',
        'model_type': '真實 AI 模型',
        'categories': categories,
        'input_shape': model.input_shape,
        'output_shape': model.output_shape
    })

# 健康檢查路由
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'running',
        'model_loaded': model is not None,
        'model_type': '真實 AI 模型' if model else '無',
        'categories': categories
    })

# 主頁路由
@app.route('/')
def index():
    model_status = "✅ 已載入真實 AI 模型" if model else "❌ 未載入"
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI 圖片分類器 - 真實模型</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .status {{ padding: 10px; border-radius: 5px; margin: 10px 0; }}
            .ready {{ background: #d4edda; color: #155724; }}
            .categories {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }}
            .category {{ padding: 10px; background: #e9ecef; border-radius: 5px; text-align: center; }}
        </style>
    </head>
    <body>
        <h1>🎯 AI 圖片分類器 - 真實模型版本</h1>
        
        <div class="status ready">
            <strong>模型狀態:</strong> {model_status}
        </div>
        
        <h3>可識別的運動類別:</h3>
        <div class="categories">
            {"".join([f'<div class="category">{category}</div>' for category in categories])}
        </div>
        
        <p>後端服務運行中！請使用前端界面進行圖片分類。</p>
        <p>前端應該運行在 <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></p>
        
        <div style="margin-top: 20px;">
            <a href="/health">API 狀態檢查</a> | 
            <a href="/model-info">模型資訊</a>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    # 建立必要的資料夾
    os.makedirs('uploads', exist_ok=True)
    
    print("🚀 啟動 AI 圖片分類器（真實模型版本）...")
    print("📝 可識別類別:", categories)
    print("🔍 模型狀態:", "已載入真實 AI 模型" if model else "未載入")
    print("🌐 服務運行在: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)