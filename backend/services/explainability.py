import shap
import numpy as np

explainer = None
feature_names = []

def init_explainer(model, X_background, f_names):
    global explainer, feature_names
    feature_names = f_names
    # SHAP KernelExplainer is highly compatible with generic TF Keras predictive functions
    # Using a small background dataset (e.g., 50 random samples) for speed
    
    # Wrap model.predict to disable verbose output, preventing UnicodeEncodeError with cp1252 encoding on Windows
    def predict_fn(x):
        return model.predict(x, verbose=0)
        
    explainer = shap.KernelExplainer(predict_fn, shap.sample(X_background, 50))

def get_shap_values(X_instance):
    """
    Returns the base value and feature importance array for a given instance.
    """
    if explainer is None:
        return None, None
        
    shap_values = explainer.shap_values(X_instance)
    
    # KernelExplainer on a single output model might return a list or an array directly
    if isinstance(shap_values, list):
        shap_vals = shap_values[0][0] # For binary class output 0
    else:
        shap_vals = shap_values[0] # Single instance
    
    # We want a dictionary mapping feature names to their SHAP values
    importance = {feature_names[i]: float(shap_vals[i]) for i in range(len(feature_names))}
    
    base_value = float(explainer.expected_value[0] if isinstance(explainer.expected_value, list) or isinstance(explainer.expected_value, np.ndarray) else explainer.expected_value)

    return base_value, importance
