import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

print("🚀 開始訓練真實 AI 模型...")

# 定義運動類別（與你的資料夾名稱一致）
categories = ["籃球", "足球", "網球", "游泳", "跑步", "自行車"]

def create_model(input_shape, num_classes):
    """建立 CNN 模型"""
    model = keras.Sequential([
        # 第一個卷積層
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.MaxPooling2D((2, 2)),
        
        # 第二個卷積層
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # 第三個卷積層
        layers.Conv2D(64, (3, 3), activation='relu'),
        
        # 全連接層
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.5),  # 防止過擬合
        
        # 輸出層
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def load_and_preprocess_image(image_path, target_size=(150, 150)):
    """載入和預處理圖片"""
    try:
        img = Image.open(image_path)
        img = img.resize(target_size)
        img_array = np.array(img)
        
        # 處理不同通道數的圖片
        if len(img_array.shape) == 2:  # 灰階圖片
            img_array = np.stack([img_array] * 3, axis=-1)
        elif img_array.shape[2] == 4:  # RGBA圖片
            img_array = img_array[:, :, :3]
        
        img_array = img_array.astype('float32') / 255.0  # 正規化
        return img_array
    except Exception as e:
        print(f"無法處理圖片 {image_path}: {e}")
        return None

def load_dataset(data_dir):
    """載入訓練資料集"""
    images = []
    labels = []
    
    print("📥 載入訓練圖片...")
    
    for category_idx, category in enumerate(categories):
        category_path = os.path.join(data_dir, category)
        
        if not os.path.exists(category_path):
            print(f"❌ 警告: 資料夾 {category_path} 不存在")
            continue
            
        image_files = [f for f in os.listdir(category_path) 
                      if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        print(f"   {category}: {len(image_files)} 張圖片")
        
        for image_name in image_files:
            image_path = os.path.join(category_path, image_name)
            
            img_array = load_and_preprocess_image(image_path)
            if img_array is not None:
                images.append(img_array)
                labels.append(category_idx)
    
    if len(images) == 0:
        print("❌ 錯誤: 沒有找到任何訓練圖片！")
        return None, None
    
    print(f"✅ 成功載入 {len(images)} 張圖片")
    return np.array(images), np.array(labels)

def train_model():
    """訓練模型主函數"""
    data_dir = "training_data"
    
    # 載入資料
    X, y = load_dataset(data_dir)
    if X is None:
        return
    
    # 將標籤轉換為 one-hot 編碼
    y_categorical = keras.utils.to_categorical(y, num_classes=len(categories))
    
    # 分割訓練集和測試集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"📊 資料分割:")
    print(f"   訓練集: {X_train.shape[0]} 張圖片")
    print(f"   測試集: {X_test.shape[0]} 張圖片")
    
    # 建立模型
    model = create_model(X_train[0].shape, len(categories))
    
    print("🧠 模型結構:")
    model.summary()
    
    # 訓練模型
    print("🎯 開始訓練模型...")
    history = model.fit(
        X_train, y_train,
        epochs=20,
        batch_size=16,  # 如果記憶體不足可以調小
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # 評估模型
    print("📈 評估模型...")
    test_loss, test_acc = model.evaluate(X_test, y_test)
    print(f"✅ 測試準確率: {test_acc:.2%}")
    
    # 儲存模型
    model.save('sports_model.h5')
    print("💾 模型已儲存為 'sports_model.h5'")
    
    # 繪製訓練過程
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='訓練準確率')
    plt.plot(history.history['val_accuracy'], label='驗證準確率')
    plt.title('模型準確率')
    plt.xlabel('Epoch')
    plt.ylabel('準確率')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='訓練損失')
    plt.plot(history.history['val_loss'], label='驗證損失')
    plt.title('模型損失')
    plt.xlabel('Epoch')
    plt.ylabel('損失')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    print("📊 訓練歷程圖已儲存為 'training_history.png'")
    
    return model

if __name__ == "__main__":
    # 檢查 TensorFlow 版本和 GPU
    print(f"TensorFlow 版本: {tf.__version__}")
    print(f"GPU 可用: {len(tf.config.list_physical_devices('GPU')) > 0}")
    
    # 開始訓練
    trained_model = train_model()
    
    if trained_model:
        print("\n🎉 AI 模型訓練完成！")
        print("現在可以修改 app.py 使用真實模型了！")
    else:
        print("\n❌ 訓練失敗，請檢查訓練資料！")