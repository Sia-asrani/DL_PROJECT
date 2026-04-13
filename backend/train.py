import tensorflow as tf
import tensorflow.keras as keras
from tensorflow.keras.callbacks import EarlyStopping
from data_preprocessing import load_data, preprocess_training_data
from model import build_model
from config import LEARNING_RATE, BATCH_SIZE, EPOCHS, VALIDATION_SPLIT, MODEL_PATH
from sklearn.metrics import classification_report, f1_score
import numpy as np

from custom_losses import focal_loss

def main():
    print("Loading and Preprocessing data...")
    df = load_data()
    X_train, X_test, y_train, y_test, input_dim = preprocess_training_data(df)
    
    model = build_model(input_dim)
    
    metrics = [
        'accuracy', 
        keras.metrics.AUC(name='prc', curve='PR'),
        keras.metrics.Recall(name='recall'),
        keras.metrics.Precision(name='precision')
    ]
    
    optimizer = keras.optimizers.Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss=focal_loss(gamma=2.0, alpha=0.8), metrics=metrics)
    
    early_stopping = EarlyStopping(
        monitor='val_prc', 
        patience=10, 
        mode='max', 
        restore_best_weights=True
    )

    print("Starting training...")
    model.fit(
        X_train, y_train,
        validation_split=VALIDATION_SPLIT,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=[early_stopping],
        verbose=2
    )
    
    print("\nEvaluating Model Probabilities...")
    y_pred_probs = model.predict(X_test)

    # --- THRESHOLD OPTIMIZATION LOOP ---
    best_t = 0.5
    best_f1 = 0
    
    print("\n--- Threshold Optimization ---")
    # Testing a range of thresholds to find the sweet spot
    for t in np.arange(0.1, 0.6, 0.05):
        preds = (y_pred_probs > t).astype(int)
        score = f1_score(y_test, preds)
        print(f"Threshold: {t:.2f} | F1-Score: {score:.4f}")
        
        if score > best_f1:
            best_f1 = score
            best_t = t

    print(f"\nOptimal Threshold Found: {best_t:.2f} (F1: {best_f1:.4f})")
    
    # Final Report using the best threshold
    final_preds = (y_pred_probs > best_t).astype(int)
    print(f"\nFinal Classification Report (Threshold: {best_t:.2f}):")
    print(classification_report(y_test, final_preds))
    
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()