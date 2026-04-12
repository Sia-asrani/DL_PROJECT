import tensorflow as tf
from data_preprocessing import load_data, preprocess_training_data
from config import MODEL_PATH
from sklearn.metrics import classification_report, confusion_matrix
import sys

def evaluate():
    print("Loading data for evaluation...")
    df = load_data()
    X_train, X_test, y_train, y_test, _ = preprocess_training_data(df)
    
    print("Loading model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    print("Evaluating model...")
    results = model.evaluate(X_test, y_test, verbose=0, return_dict=True)
    
    y_pred_probs = model.predict(X_test, verbose=0)
    y_pred = (y_pred_probs > 0.5).astype(int)
    
    cl_report = classification_report(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- PERFORMANCE METRICS ---")
    print(f"Accuracy: {results.get('accuracy', 0):.4f}")
    if 'precision' in results:
        print(f"Precision: {results['precision']:.4f}")
    if 'recall' in results:
        print(f"Recall: {results['recall']:.4f}")
    
    print("\n--- CLASSIFICATION REPORT ---")
    print(cl_report)
    
    print("\n--- CONFUSION MATRIX ---")
    print(f"True Negatives: {cm[0][0]} | False Positives: {cm[0][1]}")
    print(f"False Negatives: {cm[1][0]} | True Positives: {cm[1][1]}")

if __name__ == "__main__":
    evaluate()
