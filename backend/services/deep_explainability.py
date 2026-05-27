# backend/services/deep_explainability.py
import numpy as np
import shap
from services import explainability as kernel_explainability

explainer = None
feature_names = []
categorical_features = []
use_kernel_fallback = False
shap_cache = {}

def _cache_key(X_instance):
    return tuple(np.round(np.asarray(X_instance).ravel(), 4))

def init_explainer(model, X_background, f_names, categorical_feature_names=None):
    global explainer, feature_names, categorical_features, use_kernel_fallback, shap_cache
    feature_names = f_names
    categorical_features = list(categorical_feature_names or [])
    use_kernel_fallback = False
    shap_cache = {}

    try:
        background = shap.sample(X_background, 100)
        explainer = shap.DeepExplainer(model, background)
    except Exception as exc:
        print(f"DeepExplainer init failed, falling back to KernelExplainer: {exc}")
        explainer = None
        use_kernel_fallback = True
        kernel_explainability.init_explainer(
            model,
            X_background,
            f_names,
            categorical_feature_names,
        )

def get_shap_values(X_instance):
    global use_kernel_fallback
    key = _cache_key(X_instance)

    if key in shap_cache:
        return shap_cache[key]

    if use_kernel_fallback:
        result = kernel_explainability.get_shap_values(X_instance)
        shap_cache[key] = result
        return result

    if explainer is None:
        return None, None

    try:
        shap_values = explainer.shap_values(X_instance)
    except Exception as exc:
        print(f"DeepExplainer inference failed, falling back to KernelExplainer: {exc}")
        use_kernel_fallback = True
        result = kernel_explainability.get_shap_values(X_instance)
        shap_cache[key] = result
        return result

    sv = np.asarray(shap_values)
    squeezed = np.squeeze(sv)

    if squeezed.ndim == 1:
        shap_vals = squeezed
    else:
        shap_vals = squeezed[0]

    shap_vals = np.asarray(shap_vals).ravel()
    importance = {feature_names[i]: float(shap_vals[i]) for i in range(len(feature_names))}

    aggregated = {}
    for name, value in importance.items():
        grouped_name = name
        for categorical_name in categorical_features:
            prefix = f"{categorical_name}_"
            if name.startswith(prefix):
                grouped_name = categorical_name
                break
        aggregated[grouped_name] = aggregated.get(grouped_name, 0.0) + value

    ev = explainer.expected_value
    base_value = float(np.asarray(ev).ravel()[0])

    result = (base_value, aggregated)
    shap_cache[key] = result
    return result

def prewarm_shap_cache(X_instance):
    # We prewarm the known default form input instead of relying only on lazy caching
    # so the most common first user request avoids paying the initial SHAP latency.
    return get_shap_values(X_instance)
