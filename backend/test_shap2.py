import sys
import os

sys.path.append(r"c:\Users\sgsdh\dl_project\backend")
import tensorflow as tf
from data_preprocessing import load_data, preprocess_training_data
import shap
import numpy as np

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

df = load_data()
X_train, _, _, _, _ = preprocess_training_data(df)
X_background = shap.sample(X_train, 10) # 10 background to be extremely fast

model = tf.keras.models.load_model(r"c:\Users\sgsdh\dl_project\backend\depression_model.keras")

def predict_fn(x):
    return model.predict(x, verbose=0).flatten()

print("Initializing KernelExplainer...")
explainer = shap.KernelExplainer(predict_fn, X_background)
print("Explainer initialized. Testing instance...")

try:
    X_instance = X_train[0:1] # shape (1, M)
    shap_vals = explainer.shap_values(X_instance)
    print("Success. output:", shap_vals)
    import json
    # test dictionary creation
    feature_names = [f"f{i}" for i in range(X_train.shape[1])]
    
    # KernelExplainer on a single output model might return a list or an array directly
    if isinstance(shap_vals, list):
        print("List shape:", np.array(shap_vals).shape)
        shap_vals_extracted = shap_vals[0][0] # For binary class output 0
    else:
        print("Array shape:", np.array(shap_vals).shape)
        shap_vals_extracted = shap_vals[0] # Single instance
        
    importance = {feature_names[i]: float(shap_vals_extracted[i]) for i in range(len(feature_names))}
    print("Base value:", explainer.expected_value)
    print("Importance:", importance)
except Exception as e:
    import traceback
    traceback.print_exc()
