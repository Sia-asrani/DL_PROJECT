from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from pydantic import model_validator
from typing import List, Dict, Any
import pandas as pd
import io

from data_preprocessing import preprocess_inference_data, load_data, TARGET_COL, NUMERICAL_COLS, CATEGORICAL_COLS
from services.recommendations import generate_recommendations
from services.deep_explainability import get_shap_values

router = APIRouter()

# Define request schema using Pydantic
class StudentData(BaseModel):
    Age: int = Field(..., gt=0, le=100, example=21)
    Gender: str = Field(..., example="Female")
    Department: str = Field(..., example="Computer Science")
    CGPA: float = Field(..., ge=0.0, le=4.0, example=3.5)
    Sleep_Duration: float = Field(..., ge=0.0, example=7.5)
    Study_Hours: float = Field(..., ge=0.0, example=4.0)
    Social_Media_Hours: float = Field(..., ge=0.0, example=3.0)
    Physical_Activity: float = Field(..., ge=0.0, example=60)
    Stress_Level: int = Field(..., ge=0, le=10, example=4)

    @model_validator(mode="after")
    def validate_daily_time_budget(self):
        total_committed_hours = self.Sleep_Duration + self.Study_Hours + (self.Physical_Activity / 60)
        if total_committed_hours > 24:
            raise ValueError("Sleep, study, and exercise time combined must be 24 hours or less.")
        return self

# Global variables to hold model injected by app.py
model_instance = None

def set_model(model):
    global model_instance
    model_instance = model

@router.post("/predict")
def predict_depression(data: StudentData):
    if model_instance is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    try:
        data_dict = data.model_dump()
        X_processed = preprocess_inference_data(data_dict)

        # Handle different output shapes from model.predict robustly
        pred_arr = model_instance.predict(X_processed, verbose=0)
        import numpy as _np
        pred_flat = _np.asarray(pred_arr).ravel()
        if pred_flat.size == 0:
            raise ValueError("Model returned empty prediction array")
        prediction_prob = float(pred_flat[0])
        prediction_class = bool(prediction_prob > 0.5)
        
        # Explainability
        base_value, shap_importance = get_shap_values(X_processed)
        
        # Recommendations
        recommendations = generate_recommendations(data_dict, prediction_prob)
        
        return {
            "probability": prediction_prob,
            "risk_level": "High" if prediction_prob > 0.7 else "Moderate" if prediction_prob > 0.4 else "Low",
            "prediction": prediction_class,
            "shap_base_value": base_value,
            "shap_values": shap_importance,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/batch")
async def batch_predict(file: UploadFile = File(...)):
    if model_instance is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Preprocess each using batch
        results = []
        for index, row in df.iterrows():
            data_dict = row.to_dict()
            try:
                X_processed = preprocess_inference_data(data_dict)
                pred_arr = model_instance.predict(X_processed, verbose=0)
                import numpy as _np
                pred_flat = _np.asarray(pred_arr).ravel()
                if pred_flat.size == 0:
                    raise ValueError("Model returned empty prediction array")
                prediction_prob = float(pred_flat[0])
                results.append({
                    "row": index,
                    "probability": prediction_prob,
                    "prediction": bool(prediction_prob > 0.5)
                })
            except Exception as inner_e:
                results.append({"row": index, "error": str(inner_e)})
                
        # Aggregate stats
        total = len(results)
        positive_predictions = sum(1 for r in results if r.get("prediction", False))
        
        return {
            "total_processed": total,
            "depression_detected_count": positive_predictions,
            "anomalies_detected": total - positive_predictions,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing error: {str(e)}")

@router.get("/stats")
def dataset_stats():
    """ Returns global statistics for charts in the frontend overview. """
    try:
        df = load_data()
        stats = {
            "total_records": len(df),
            "depression_rate": float(df[TARGET_COL].astype(int).mean()),
            "avg_stress": float(df["Stress_Level"].mean()),
            "avg_sleep": float(df["Sleep_Duration"].mean()),
            "gender_dist": df["Gender"].value_counts().to_dict(),
            "department_dist": df["Department"].value_counts().to_dict()
        }
        
        # Simple correlation focus (Stress vs Study vs Sleep)
        corr_matrix = df[["Stress_Level", "Study_Hours", "Sleep_Duration", "Physical_Activity", TARGET_COL]].corr().to_dict()
        stats["correlations"] = corr_matrix
        
        # Sample data for Scatter Plot (max 200 points to keep payload super fast)
        scatter_sample = df[["Stress_Level", "Sleep_Duration", "Study_Hours"]].sample(n=min(200, len(df))).to_dict(orient="records")
        stats["scatter_data"] = scatter_sample
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
