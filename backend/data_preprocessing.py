import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from config import DATA_PATH, SCALER_PATH, ENCODER_PATH, TARGET_COL, NUMERICAL_COLS, CATEGORICAL_COLS, DROP_COLS

def load_data():
    df = pd.read_csv(DATA_PATH)
    return df

def preprocess_training_data(df):
    # Drop irrelevant columns
    df = df.drop(columns=DROP_COLS, errors="ignore")
    
    # Handle missing values if any
    df = df.dropna()

    # Split features and target
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL].astype(int).values # True/False to 1/0

    # Separate numerical and categorical
    X_num = X[NUMERICAL_COLS]
    X_cat = X[CATEGORICAL_COLS]

    # Scale numerical
    scaler = StandardScaler()
    X_num_scaled = scaler.fit_transform(X_num)

    # Encode categorical
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    X_cat_encoded = encoder.fit_transform(X_cat)

    # Combine back
    X_processed = np.hstack((X_num_scaled, X_cat_encoded))

    # Save scaler and encoder
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(encoder, ENCODER_PATH)

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)

    return X_train, X_test, y_train, y_test, X_processed.shape[1]

def preprocess_inference_data(data_dict):
    """
    Called by the backend to preprocess a single incoming record.
    """
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENCODER_PATH)

    df = pd.DataFrame([data_dict])
    
    X_num = df[NUMERICAL_COLS]
    X_cat = df[CATEGORICAL_COLS]

    X_num_scaled = scaler.transform(X_num)
    X_cat_encoded = encoder.transform(X_cat)

    X_processed = np.hstack((X_num_scaled, X_cat_encoded))
    return X_processed
