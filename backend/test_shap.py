import sys
import os
import tensorflow as tf
import tensorflow.keras as keras
from tensorflow.keras import Model

# sys.path.append(r"D:\5_DL_LAB_PROJ\dl_project\backend")
sys.path.append(r"D:\5_DL_LAB_PROJ\dl_project\backend")
import tensorflow as tf
from data_preprocessing import load_data, preprocess_training_data
import shap

df = load_data()
X_train, _, _, _, _ = preprocess_training_data(df)

model = keras.models.load_model(r"D:\5_DL_LAB_PROJ\dl_project\backend\depression_model.keras")

try:
    print("Initializing KernelExplainer...")
    explainer = shap.KernelExplainer(model.predict, shap.sample(X_train, 10))
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
