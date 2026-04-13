import json
import os
import tempfile
import zipfile

import keras
import tensorflow as tf


LEGACY_CONFIG_KEYS = {
    "quantization_config",
    "renorm",
    "renorm_clipping",
    "renorm_momentum",
}


def _sanitize_legacy_config(obj):
    if isinstance(obj, dict):
        cleaned = {
            key: _sanitize_legacy_config(value)
            for key, value in obj.items()
            if key not in LEGACY_CONFIG_KEYS
        }
        if cleaned.get("class_name") in {"Sequential", "Functional"}:
            cleaned["compile_config"] = None
        return cleaned
    if isinstance(obj, list):
        return [_sanitize_legacy_config(item) for item in obj]
    return obj


def _load_from_sanitized_archive(model_path, custom_objects=None):
    with zipfile.ZipFile(model_path) as archive:
        config = json.loads(archive.read("config.json"))
        sanitized_config = _sanitize_legacy_config(config)
        fd, temp_weights_path = tempfile.mkstemp(
            suffix=".weights.h5",
            dir=os.path.dirname(model_path),
        )
        os.close(fd)
        with open(temp_weights_path, "wb") as weights_file:
            weights_file.write(archive.read("model.weights.h5"))

    try:
        model = keras.saving.deserialize_keras_object(
            sanitized_config,
            custom_objects=custom_objects,
            safe_mode=False,
        )
        model.load_weights(temp_weights_path)
        return model
    finally:
        if os.path.exists(temp_weights_path):
            try:
                os.remove(temp_weights_path)
            except PermissionError:
                pass


def load_prediction_model(model_path, custom_objects=None):
    try:
        return tf.keras.models.load_model(
            model_path,
            custom_objects=custom_objects,
            compile=False,
        )
    except (TypeError, ValueError) as exc:
        message = str(exc)
        is_legacy_config_error = (
            "quantization_config" in message
            or "renorm" in message
            or "could not be deserialized properly" in message.lower()
        )
        if not model_path.endswith(".keras") or not is_legacy_config_error:
            raise
        return _load_from_sanitized_archive(model_path, custom_objects=custom_objects)
