import tensorflow as tf
import tensorflow.keras as keras

def build_model(input_shape):
    """
    Builds the Deep Neural Network with specific Keras aliasing.
    """
    model = keras.models.Sequential([
        keras.layers.Dense(128, activation='relu', input_shape=(input_shape,)),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        
        keras.layers.Dense(64, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        
        keras.layers.Dense(32, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.2),
        
        keras.layers.Dense(1, activation='sigmoid')
    ])
    
    return model