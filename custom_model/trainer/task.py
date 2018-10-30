import argparse
import tensorflow as tf
import tensorflow_hub as hub
import trainer.model as model
import pandas as pd

HUB_MODULES = {
  'universal-sentence-large': 'https://tfhub.dev/google/universal-sentence-encoder-large/3',
  'universal-sentence': 'https://tfhub.dev/google/universal-sentence-encoder/2',
  'universal-sentence-lite': 'https://tfhub.dev/google/universal-sentence-encoder-lite/2',
  'nnlm-128-normalized': 'https://tfhub.dev/google/nnlm-en-dim128-with-normalization/1',
  'nnlm-128': 'https://tfhub.dev/google/nnlm-en-dim128/1',
  'elmo': 'https://tfhub.dev/google/elmo/2',
  'random': 'https://tfhub.dev/google/random-nnlm-en-dim128/1',
}

def parse_args():
  """Parses command line arguements."""
  parser = argparse.ArgumentParser()
  # Input Arguments
  parser.add_argument(
      '--train-file',
      help='Path to train.csv.gz outputfrom preprocess.py',
      required=True,
  )
  parser.add_argument(
      '--test-file',
      help='Path to test.csv.gz outputfrom preprocess.py',
      required=True,
  )
  parser.add_argument(
      '--job-dir',
      help='GCS location to write checkpoints and export models',
      required=True,
  )

  # Training arguments - hparams which can be tuned.
  parser.add_argument(
      '--dropout',
      help='Dropout between layers in DNN.',
      default=0.35,
      type=float
  )
  parser.add_argument(
      '--learning-rate',
      help='Learning rate for the optimizer.',
      default=0.01,
      type=float
  )
  parser.add_argument(
      '--first-layer-size',
      help='Number of nodes in the first layer of the DNN, subsequent layers will be halved.',
      default=1024,
      type=int
  )
  parser.add_argument(
      '--num-layers',
      help='Number of layers in the DNN',
      default=1,
      type=int
  )
  parser.add_argument(
      '--optimizer',
      help='Optimizer to use in learning process.',
      default='Adam',
      type=str,
      choices=['Adam', 'Adagrad', 'SGD']
  )
  parser.add_argument(
      '--hub-module',
      help='TF Hub Module Name to use',
      default='nnlm-128-normalized',
      type=str,
      choices=HUB_MODULES.keys()
  )
  parser.add_argument(
      '--train-hub-module',
      help='Whether to train the embeddings along with the DNN.',
      default=False,
      type=bool,
  )
  # Experiment arguments
  parser.add_argument(
      '--train-steps',
      help='Steps to run the training job before exiting.',
      type=int,
      default=30000
  )
  parser.add_argument(
      '--batch-size',
      help='Batch size for training steps',
      type=int,
      default=128
  )
  parser.add_argument(
      '--eval-secs',
      help='Time between evaluations.',
      type=int,
      default=60
  )
  parser.add_argument(
      '--eval-steps',
      help='Number of steps to run evalution for at each checkpoint',
      default=200,
      type=int
  )
  parser.add_argument(
      '--verbosity',
      choices=['DEBUG', 'ERROR', 'FATAL', 'INFO', 'WARN'],
      default='INFO',
  )
  return parser.parse_args()


def main(hparams):
  """Run the training and evaluation using the high level API."""
  with tf.gfile.GFile(hparams.train_file, "r") as f:
    train_df = pd.read_csv(f, compression='gzip')
  with tf.gfile.GFile(hparams.test_file, "r") as f:
    test_df = pd.read_csv(f, compression='gzip')


  tf.logging.info('Done fetching traing and test datasets.')
  trn_input = tf.estimator.inputs.pandas_input_fn(
    x=train_df,
    y=train_df["polarity"],
    num_epochs=None,
    shuffle=True,
    batch_size=hparams.batch_size,
    num_threads=4,
    queue_capacity=hparams.batch_size * 5
  )
  train_spec = tf.estimator.TrainSpec(trn_input, max_steps=hparams.train_steps)

  eval_input = tf.estimator.inputs.pandas_input_fn(
    x=test_df,
    y=test_df["polarity"],
    num_epochs=1,
    shuffle=False,
    batch_size=hparams.batch_size,
    num_threads=4,
    queue_capacity=hparams.batch_size * 5
  )


  # Construct our JSON serving function for predictions via API.
  exporter = tf.estimator.FinalExporter('model', model.build_serving_fn())
  eval_spec = tf.estimator.EvalSpec(
      eval_input,
      throttle_secs=hparams.eval_secs,
      steps=hparams.eval_steps,
      exporters=[exporter],
      start_delay_secs=20
  )

  run_config = tf.estimator.RunConfig(model_dir=hparams.job_dir)

  # Construct layers sizes by halving each layer.
  hidden_units = []
  for i in range(hparams.num_layers):
    units = hparams.first_layer_size / (2**i)
    hidden_units.append(units)

  estimator = model.build_estimator(
      config=run_config,
      hidden_units=hidden_units,
      learning_rate=hparams.learning_rate,
      dropout=hparams.dropout,
      optimizer=hparams.optimizer,
      hub_module=HUB_MODULES.get(hparams.hub_module),
      train_hub=hparams.train_hub_module
  )
  tf.estimator.train_and_evaluate(estimator, train_spec, eval_spec)


if __name__ == '__main__':
  args = parse_args()
  tf.logging.set_verbosity(args.verbosity)
  hyperparams = tf.contrib.training.HParams(**args.__dict__)
  main(hyperparams)