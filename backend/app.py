from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from contextlib import asynccontextmanager
import os
import time

from config import MODEL_PATH
from data_preprocessing import load_data, preprocess_training_data, preprocess_inference_data
from services.deep_explainability import init_explainer, prewarm_shap_cache
from services.model_loader import load_prediction_model
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
        # The saved model uses a custom focal loss defined in train.py.
        # Provide the callable via `custom_objects` so Keras can deserialize it.
        custom_objects = None
        try:
            from custom_losses import focal_loss, focal_loss_fixed
            # recreate the same configured loss used during training
            custom_objects = {
                "focal_loss_fixed": focal_loss(gamma=2.0, alpha=0.8),
                "focal_loss": focal_loss,
                "focal_loss_fixed_top": focal_loss_fixed,
            }
        except Exception as e:
            print(f"Could not import custom loss from custom_losses.py: {e}")

        model = load_prediction_model(MODEL_PATH, custom_objects=custom_objects)

        inference.set_model(model)
        
        # Initialize SHAP background dataset
        print("Initializing SHAP Explainer...")
        try:
            df = load_data()
            X_train, _, _, _, _ = preprocess_training_data(df)
            
            # Extract features manually because OneHotEncoder expands categorical columns
            # For exact feature names, we need a list matching X_train
            import joblib
            from config import ENCODER_PATH, NUMERICAL_COLS, CATEGORICAL_COLS
            encoder = joblib.load(ENCODER_PATH)
            cat_features = list(encoder.get_feature_names_out())
            all_features = NUMERICAL_COLS + cat_features
            
            init_explainer(model, X_train, all_features, CATEGORICAL_COLS)
            default_input = {
                "Age": 21,
                "Gender": "Female",
                "Department": "Science",
                "CGPA": 3.5,
                "Sleep_Duration": 7.0,
                "Study_Hours": 4.0,
                "Social_Media_Hours": 2.0,
                "Physical_Activity": 60,
                "Stress_Level": 5,
            }
            prewarm_shap_cache(preprocess_inference_data(default_input))
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

@app.middleware("http")
async def add_request_timing(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Expose timing in headers and logs so we can track real end-to-end API latency per request.
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.2f}"
    print(f"{request.method} {request.url.path} completed in {elapsed_ms:.2f} ms")
    return response

app.include_router(inference.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Student Depression Prediction Backend. Go to /docs for Swagger UI API testing."}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/ready")
def readiness_check():
    if model is None:
        raise HTTPException(status_code=503, detail={"status": "not_ready", "model_loaded": False})
    return {"status": "ready", "model_loaded": True}
