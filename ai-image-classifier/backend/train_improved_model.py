import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

print("🚀 開始訓練修正版 AI 模型...")

categories = ["籃球", "足球", "網球", "游泳", "跑步", "自行車"]

def create_fixed_model(input_shape, num_classes):
    """建立更簡單且穩定的模型"""
    model = keras.Sequential([
        # 第一個卷積層 - 更簡單的開始
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),  # 降低 dropout
        
        # 第二個卷積層
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # 第三個卷積層
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # 全連接層 - 簡化
        layers.Flatten(),
        layers.Dense(128, activation='relu'),  # 減少神經元數量
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        
        # 輸出層
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # 使用更保守的優化器設定
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0005),  # 降低學習率
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def load_and_validate_dataset(data_dir):
    """載入並驗證資料集"""
    images = []
    labels = []
    
    print("📥 載入並驗證訓練圖片...")
    
    for category_idx, category in enumerate(categories):
        category_path = os.path.join(data_dir, category)
        
        if not os.path.exists(category_path):
            print(f"❌ 警告: 資料夾 {category_path} 不存在")
            continue
            
        image_files = [f for f in os.listdir(category_path) 
                      if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        print(f"   {category}: {len(image_files)} 張圖片")
        
        valid_count = 0
        for image_name in image_files:
            image_path = os.path.join(category_path, image_name)
            
            try:
                img = Image.open(image_path)
                img = img.resize((150, 150))  # 改回較小的尺寸，避免過擬合
                img_array = np.array(img)
                
                # 處理不同通道數的圖片
                if len(img_array.shape) == 2:
                    img_array = np.stack([img_array] * 3, axis=-1)
                elif img_array.shape[2] == 4:
                    img_array = img_array[:, :, :3]
                
                # 確保是 3 通道
                if img_array.shape[2] != 3:
                    continue
                
                img_array = img_array.astype('float32') / 255.0
                
                images.append(img_array)
                labels.append(category_idx)
                valid_count += 1
                
            except Exception as e:
                print(f"   無法處理圖片 {image_path}: {e}")
        
        print(f"   ✅ 有效圖片: {valid_count}/{len(image_files)}")
    
    if len(images) == 0:
        print("❌ 錯誤: 沒有找到任何訓練圖片！")
        return None, None
    
    print(f"✅ 總共載入 {len(images)} 張有效圖片")
    return np.array(images), np.array(labels)

def train_fixed_model():
    """訓練修正版模型"""
    data_dir = "training_data"
    
    # 載入資料
    X, y = load_and_validate_dataset(data_dir)
    if X is None:
        return
    
    print(f"📊 資料形狀: {X.shape}")
    print(f"📊 標籤形狀: {y.shape}")
    
    # 檢查類別平衡
    unique, counts = np.unique(y, return_counts=True)
    print("📈 類別分佈:")
    for i, count in zip(unique, counts):
        print(f"   {categories[i]}: {count} 張圖片")
    
    # 將標籤轉換為 one-hot 編碼
    y_categorical = keras.utils.to_categorical(y, num_classes=len(categories))
    
    # 分割訓練集和測試集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_categorical, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"📊 資料分割:")
    print(f"   訓練集: {X_train.shape[0]} 張圖片")
    print(f"   測試集: {X_test.shape[0]} 張圖片")
    
    # 建立修正版模型
    model = create_fixed_model(X_train[0].shape, len(categories))
    
    print("🧠 模型結構:")
    model.summary()
    
    # 更好的回調函數
    callbacks = [
        keras.callbacks.EarlyStopping(
            patience=15, 
            restore_best_weights=True,
            min_delta=0.001
        ),
        keras.callbacks.ReduceLROnPlateau(
            factor=0.5, 
            patience=8,
            min_lr=0.00001
        )
    ]
    
    # 訓練模型 - 更保守的參數
    print("🎯 開始訓練修正版模型...")
    history = model.fit(
        X_train, y_train,
        epochs=30,  # 減少輪次
        batch_size=16,  # 更小的批次
        validation_data=(X_test, y_test),
        callbacks=callbacks,
        verbose=1
    )
    
    # 評估模型
    print("📈 評估模型...")
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"✅ 測試 Loss: {test_loss:.4f}")
    print(f"✅ 測試準確率: {test_acc:.2%}")
    
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
    plt.savefig('fixed_training_history.png')
    print("📊 訓練歷程圖已儲存為 'fixed_training_history.png'")
    
    # 儲存模型
    model.save('fixed_sports_model.h5')
    print("💾 修正版模型已儲存為 'fixed_sports_model.h5'")
    
    return model, test_loss, test_acc

if __name__ == "__main__":
    # 設定 TensorFlow 為記憶體增長模式
    physical_devices = tf.config.list_physical_devices('GPU')
    if physical_devices:
        tf.config.experimental.set_memory_growth(physical_devices[0], True)
    
    trained_model, test_loss, accuracy = train_fixed_model()
    
    if trained_model:
        print(f"\n🎉 修正版 AI 模型訓練完成！")
        print(f"📊 測試 Loss: {test_loss:.4f}")
        print(f"📊 測試準確率: {accuracy:.2%}")
        
        if test_loss > 2.0:
            print("⚠️  Loss 仍然偏高，建議:")
            print("   - 檢查訓練圖片質量")
            print("   - 確保每個類別有足夠圖片")
            print("   - 確認圖片確實是對應的運動類別")
    else:
        print("\n❌ 訓練失敗，請檢查訓練資料！")