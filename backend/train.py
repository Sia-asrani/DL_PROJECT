import tensorflow as tf
import tensorflow.keras as keras
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from data_preprocessing import load_data, preprocess_training_data
from model import build_model
from config import LEARNING_RATE, BATCH_SIZE, EPOCHS, VALIDATION_SPLIT, MODEL_PATH
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

def main():
    print("Num GPUs Available: ", len(tf.config.list_physical_devices('GPU')))
    if len(tf.config.list_physical_devices('GPU')) > 0:
        print("TensorFlow will naturally pick up the GPU for training.")
    else:
        print("GPU not detected. Training will fall back to CPU.")

    print("Loading data...")
    df = load_data()
    
    print("Preprocessing data...")
    X_train, X_test, y_train, y_test, input_dim = preprocess_training_data(df)
    
    print(f"Building model with input dimension: {input_dim}")
    model = build_model(input_dim)
    
    optimizer = keras.optimizers.Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer, loss='binary_crossentropy', metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()])
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    
    from sklearn.utils.class_weight import compute_class_weight
    print("Computing class weights for imbalanced data...")
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = {int(k): v for k, v in zip(np.unique(y_train), class_weights)}
    print(f"Using class weights: {class_weight_dict}")

    print("Starting training...")
    history = model.fit(
        X_train, y_train,
        validation_split=VALIDATION_SPLIT,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=[early_stopping],
        class_weight=class_weight_dict,
        verbose=2
    )
    
    print("Evaluating model...")
    results = model.evaluate(X_test, y_test, return_dict=True)
    print(f"Test Accuracy: {results['accuracy']:.4f}")
    
    y_pred_probs = model.predict(X_test)
    y_pred = (y_pred_probs > 0.5).astype(int)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nSaving final model...")
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
