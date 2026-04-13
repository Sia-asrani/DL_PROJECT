import pandas as pd
import numpy as np
import joblib
import tensorflow.keras as keras
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from config import DATA_PATH, SCALER_PATH, ENCODER_PATH, TARGET_COL, NUMERICAL_COLS, CATEGORICAL_COLS, DROP_COLS

def load_data():
    df = pd.read_csv(DATA_PATH)
    return df

def preprocess_training_data(df):
    # Drop irrelevant columns and handle missing values
    df = df.drop(columns=DROP_COLS, errors="ignore").dropna()

    # Split into features and target
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL].astype(int).values

    # 1. SPLIT FIRST to prevent data leakage
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 2. FIT tools only on Training data
    scaler = StandardScaler()
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')

    # Process Training Numerical/Categorical
    X_train_num = scaler.fit_transform(X_train_raw[NUMERICAL_COLS])
    X_train_cat = encoder.fit_transform(X_train_raw[CATEGORICAL_COLS])
    X_train = np.hstack((X_train_num, X_train_cat))

    # 3. TRANSFORM Test data using training fits
    X_test_num = scaler.transform(X_test_raw[NUMERICAL_COLS])
    X_test_cat = encoder.transform(X_test_raw[CATEGORICAL_COLS])
    X_test = np.hstack((X_test_num, X_test_cat))

    # Save scaler and encoder
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(encoder, ENCODER_PATH)

    return X_train, X_test, y_train, y_test, X_train.shape[1]

def preprocess_inference_data(data_dict):
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENCODER_PATH)
    df = pd.DataFrame([data_dict])
    X_num_scaled = scaler.transform(df[NUMERICAL_COLS])
    X_cat_encoded = encoder.transform(df[CATEGORICAL_COLS])
    return np.hstack((X_num_scaled, X_cat_encoded))