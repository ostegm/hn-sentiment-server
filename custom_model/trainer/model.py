from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import tensorflow as tf
import tensorflow_hub as hub


def get_optimizer(name, learning_rate):
  if name == 'Adam':
    return tf.train.AdamOptimizer(learning_rate=learning_rate)
  if name == 'Adagrad':
    return tf.train.ProximalAdagradOptimizer(learning_rate=learning_rate)
  if name == 'SGD':
    return tf.train.GradientDescentOptimizer(learning_rate=learning_rate)
  raise Exception('Please select valid optimizer name from (Adam, Adagrad, SGD).')


def build_estimator(config, hidden_units, learning_rate, dropout,
                    optimizer, hub_module, train_hub):
  hub_column = hub.text_embedding_column(key="sentence",  module_spec=hub_module, trainable=train_hub)
  return tf.estimator.DNNClassifier(
      config=config,
      feature_columns=[hub_column],
      hidden_units=hidden_units,
      optimizer=get_optimizer(optimizer, learning_rate),
      dropout=dropout
  )


def build_serving_fn():
  """Builds serving function based on Hparams."""
  def _json_serving_input_fn():
    inputs = {
      'sentence': tf.placeholder(shape=[None], dtype=tf.string)
    }
    return tf.estimator.export.ServingInputReceiver(inputs, inputs)
  return _json_serving_input_fn

