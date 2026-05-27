import shap
import numpy as np

explainer = None
feature_names = []
categorical_features = []

def init_explainer(model, X_background, f_names, categorical_feature_names=None):
    global explainer, feature_names, categorical_features
    feature_names = f_names
    categorical_features = list(categorical_feature_names or [])
    # SHAP KernelExplainer is highly compatible with generic TF Keras predictive functions
    # Using a small background dataset (e.g., 50 random samples) for speed
    
    # Wrap model.predict to disable verbose output, preventing UnicodeEncodeError with cp1252 encoding on Windows
    def predict_fn(x):
        return np.asarray(model.predict(x, verbose=0)).reshape(-1)
        
    explainer = shap.KernelExplainer(predict_fn, shap.sample(X_background, 50))

def get_shap_values(X_instance):
    """
    Returns the base value and feature importance array for a given instance.
    """
    if explainer is None:
        return None, None
        
    shap_values = explainer.shap_values(X_instance)

    # Normalize returned shape: SHAP may return a list (for multi-output) or ndarray
    # Convert to ndarray and pick the first output's contribution for a single-output model
    try:
        sv = np.asarray(shap_values)
    except Exception:
        # Fallback: if conversion fails, try using it directly
        sv = shap_values

    # sv may be shape (1, M), (M,), or (1, 1, M) depending on explainer
    # We flatten until we reach the feature dimension and extract first instance
    if isinstance(sv, np.ndarray):
        squeezed = np.squeeze(sv)
        if isinstance(squeezed, np.ndarray) and squeezed.ndim == 1:
            shap_vals = squeezed
        else:
            feature_axis = next(
                (axis for axis, size in enumerate(np.shape(squeezed)) if size == len(feature_names)),
                None,
            )
            if feature_axis is None:
                shap_vals = np.asarray(squeezed).reshape(-1)
            else:
                moved = np.moveaxis(np.asarray(squeezed), feature_axis, -1)
                shap_vals = moved.reshape(-1, moved.shape[-1])[0]
    else:
        # As a last resort, try list indexing
        try:
            shap_vals = shap_values[0][0]
        except Exception:
            shap_vals = shap_values[0]

    # Ensure we have a 1D array-like of length == len(feature_names)
    shap_vals = np.asarray(shap_vals).ravel()

    if shap_vals.size != len(feature_names):
        # If sizes mismatch, truncate or pad with zeros
        if shap_vals.size > len(feature_names):
            shap_vals = shap_vals[:len(feature_names)]
        else:
            pad = np.zeros(len(feature_names) - shap_vals.size)
            shap_vals = np.concatenate([shap_vals, pad])

    importance = {feature_names[i]: float(shap_vals[i]) for i in range(len(feature_names))}
    aggregated_importance = {}

    for name, value in importance.items():
        grouped_name = name
        for categorical_name in categorical_features:
            prefix = f"{categorical_name}_"
            if name.startswith(prefix):
                grouped_name = categorical_name
                break

        aggregated_importance[grouped_name] = aggregated_importance.get(grouped_name, 0.0) + value

    # Base value may be a scalar, list, or ndarray
    ev = explainer.expected_value
    if isinstance(ev, (list, np.ndarray)):
        if len(ev) > 0:
            base_value = float(np.asarray(ev).ravel()[0])
        else:
            base_value = None
    else:
        base_value = float(ev)

    return base_value, aggregated_importance
