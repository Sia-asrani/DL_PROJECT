import tensorflow as tf
from tensorflow.keras.utils import register_keras_serializable
import tensorflow.keras.backend as K


@register_keras_serializable(package="custom_losses")
def focal_loss(gamma=2.0, alpha=0.8):
    """Factory that returns a focal loss function configured with gamma and alpha.

    Use this when compiling the model: `loss=focal_loss(gamma=2.0, alpha=0.8)`.
    """
    def focal_loss_fixed(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        epsilon = K.epsilon()
        y_pred = K.clip(y_pred, epsilon, 1.0 - epsilon)

        pos_loss = -y_true * alpha * K.pow(1.0 - y_pred, gamma) * K.log(y_pred)
        neg_loss = -(1.0 - y_true) * (1.0 - alpha) * K.pow(y_pred, gamma) * K.log(1.0 - y_pred)

        return K.mean(pos_loss + neg_loss, axis=-1)

    return focal_loss_fixed


@register_keras_serializable(package="custom_losses")
def focal_loss_fixed(y_true, y_pred):
    """A default focal loss function with gamma=2.0 and alpha=0.8.

    This top-level function helps Keras locate the callable when a saved
    model references a function named `focal_loss_fixed` during deserialization.
    It simply delegates to the configured factory above.
    """
    fn = focal_loss(gamma=2.0, alpha=0.8)
    return fn(y_true, y_pred)
