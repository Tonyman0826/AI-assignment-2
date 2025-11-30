from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random

app = Flask(__name__)
CORS(app)  # 啟用 CORS

# 定義運動類別
categories = ["籃球", "足球", "網球", "游泳", "跑步", "自行車"]

@app.route('/predict', methods=['POST'])
def predict():
    print("✅ 收到預測請求！")
    
    if 'image' not in request.files:
        print("❌ 沒有上傳圖片")
        return jsonify({'error': '沒有上傳圖片'})
    
    file = request.files['image']
    if file.filename == '':
        print("❌ 沒有選擇檔案")
        return jsonify({'error': '沒有選擇檔案'})
    
    print(f"✅ 收到檔案: {file.filename}")
    
    try:
        # 模擬 AI 預測結果
        predicted_category = random.choice(categories)
        confidence = round(random.uniform(0.7, 0.95), 2)
        
        # 建立所有類別的模擬機率
        all_predictions = {}
        base_prob = (1.0 - confidence) / (len(categories) - 1)
        for category in categories:
            if category == predicted_category:
                all_predictions[category] = confidence
            else:
                all_predictions[category] = round(base_prob, 3)
        
        result = {
            'category': predicted_category,
            'confidence': confidence,
            'all_predictions': all_predictions,
            'message': '這是模擬結果（模型訓練中）'
        }
        
        print(f"✅ 返回預測結果: {predicted_category} (信心度: {confidence})")
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ 預測錯誤: {e}")
        return jsonify({'error': str(e)})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'running',
        'message': '後端服務正常運行',
        'categories': categories
    })

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI 圖片分類器後端</title>
    </head>
    <body>
        <h1>✅ AI 圖片分類器後端服務</h1>
        <p>後端服務正常運行中！使用模擬資料。</p>
        <p>請使用前端界面進行圖片分類：<a href="http://localhost:5173">http://localhost:5173</a></p>
        <p><a href="/health">檢查 API 狀態</a></p>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("🚀 啟動簡化版後端服務...")
    print("📝 可用類別:", categories)
    print("🌐 服務運行在: http://localhost:5000")
    print("💡 這是模擬版本，會返回隨機結果")
    
    app.run(debug=True, host='0.0.0.0', port=5000)