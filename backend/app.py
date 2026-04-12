from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from contextlib import asynccontextmanager
import os

from config import MODEL_PATH
from data_preprocessing import load_data, preprocess_training_data
from services.explainability import init_explainer
from routers import inference

# Global variables
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    
    # Load Model
    print("Initializing Backend System...")
    if not os.path.exists(MODEL_PATH):
        print("Warning: Model file not found. Ensure train.py has been run.")
    else:
        model = tf.keras.models.load_model(MODEL_PATH)
        inference.set_model(model)
        
        # Initialize SHAP background dataset
        print("Initializing SHAP Explainer...")
        try:
            df = load_data()
            X_train, _, _, _, _ = preprocess_training_data(df)
            
            # Extract features manually because OneHotEncoder expands categorical columns
            # For exact feature names, we need a list matching X_train
            import joblib
            from config import ENCODER_PATH, NUMERICAL_COLS
            encoder = joblib.load(ENCODER_PATH)
            cat_features = list(encoder.get_feature_names_out())
            all_features = NUMERICAL_COLS + cat_features
            
            init_explainer(model, X_train, all_features)
            print("SHAP Explainer ready.")
        except Exception as e:
            print(f"SHAP Initialization error: {e}")
            
    yield
    print("Shutting down Backend System...")

app = FastAPI(
    title="Student Depression Prediction API",
    description="API for predicting the likelihood of depression in students.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inference.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Student Depression Prediction Backend. Go to /docs for Swagger UI API testing."}
