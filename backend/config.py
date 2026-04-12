import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "student_lifestyle_100k.csv")
MODEL_PATH = os.path.join(BASE_DIR, "depression_model.keras")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "encoder.pkl")

# Hyperparameters
BATCH_SIZE = 64
EPOCHS = 30
LEARNING_RATE = 0.001
VALIDATION_SPLIT = 0.2

# Features
TARGET_COL = "Depression"
NUMERICAL_COLS = ["Age", "CGPA", "Sleep_Duration", "Study_Hours", "Social_Media_Hours", "Physical_Activity", "Stress_Level"]
CATEGORICAL_COLS = ["Gender", "Department"]
DROP_COLS = ["Student_ID"]
