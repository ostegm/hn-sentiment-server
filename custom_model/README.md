# Train a custom Sentiment model and deploy it on GCP using Kubernetes & Tensorflow Serving

This directory contains the code used to train a custom sentiment model using GCP's ml engine and then deploy the trained model to GCP using docker/kubernetes and tensorflow serving.
The idea here is to be able to send classification requests from the server to either GCP's NLP API or our own sentiment API.


## Pre-reqs:
 ```
export GCP_PROJECT=`gcloud config get-value project`
export BUCKET=gs://[YOUR BUCKET NAME]
gsutil mb $BUCKET
```


## Preprocess the datasets into CSV files on GCS
```
python preprocess.py
gsutil cp ./test.csv.gz "${BUCKET}/"
gsutil cp ./train.csv.gz "${BUCKET}/"
```

## Run a short local training job to ensure model can train

```
#remove local dir incase you're re-running this step.
rm -rf ./test
gcloud ml-engine local train \
 --package-path trainer \
 --module-name trainer.task \
 --job-dir './test' \
 -- --train-file="${BUCKET}/train.csv.gz" \
    --test-file="${BUCKET}/test.csv.gz" \
    --train-steps 100 \
    --batch-size=10
```

## Run a hyperparameter tuning job on GCS

```
export JOB_NAME=sentiment_tuning_0
export GCS_JOB_DIR="${BUCKET}/${JOB_NAME}"
gcloud ml-engine jobs submit training ${JOB_NAME} \
  --config hptuning_config.yaml \
  --runtime-version 1.10 \
  --job-dir $GCS_JOB_DIR \
  --module-name trainer.task \
  --package-path trainer/ \
  --region us-central1 \
  -- --train-file="${BUCKET}/train.csv.gz" \
    --test-file="${BUCKET}/test.csv.gz"

```

## Deploy trained model to load balanced cluster using kubernetes
```
#############################################
## Pull down trained model to local directory.
#############################################
mkdir -p /tmp/models/sentiment
gsutil cp ${GCS_JOB_DIR}/export/model /tmp/models/sentiment


#############################################
## SETUP YOUR DOCKER IMAGE FOR DEPLOYEMENT
#############################################
docker pull tensorflow/serving
# Startup a daemon
docker run -d --name serving_base tensorflow/serving
# Copy our exported model to this docker image
docker cp /tmp/models/sentiment serving_base:/models/sentiment
# Commit the change
docker commit --change "ENV MODEL_NAME sentiment" serving_base $USER/sentiment_serving
# Shut down the base image
docker kill serving_base
# Starup our modified server and make a test POST request:
docker run -p 8501:8501 -t $USER/sentiment_serving &
curl -d '{"instances": ["this is so bad", " love"]}' -X POST http://localhost:8501/v1/models/sentiment:predict


#############################################
## Start cluster and deploy
#############################################
gcloud auth login --project ${GCP_PROJECT}
gcloud container clusters create sentiment-serving-cluster --num-nodes 3 --region us-central1
# Setup credentials
gcloud config set container/cluster sentiment-serving-cluster
gcloud container clusters get-credentials sentiment-serving-cluster --region us-central1
# Tag image and push to gcp repo
docker tag $USER/sentiment_serving gcr.io/$GCP_PROJECT/sentiment
gcloud docker -- push gcr.io/$GCP_PROJECT/sentiment
# Start deployment and wait for service to be up.
kubectl create -f kube_deploy.yaml
kubectl get services
# Get external id from the response of `get services` and use it to ping the server.
curl -d '{"instances": ["this is so bad", " love"]}' -X POST 35.226.186.209:8501/v1/models/sentiment:predict

```


## Model Versioning
To push a new model version, simply create a new docker image, push to the cloud repo, and edit the kuberenetes deployment to use this new image.
Kubenetes engine deployments will automatically roll out the new model version without downtime. 
```
MODEL_VERSION="V2"
IMAGE_NAME="gcr.io/$GCP_PROJECT/sentiment"
mkdir -p /tmp/models/sentiment/$MODEL_VERSION}
gsutil cp ${GCS_JOB_DIR}/export/model /tmp/models/sentiment/$MODEL_VERSION}
docker run -d --name serving_base tensorflow/serving
docker cp /tmp/models/sentiment/$MODEL_VERSION} serving_base:/models/sentiment
docker commit --change "ENV MODEL_NAME sentiment" serving_base $USER/sentiment_serving:${MODEL_VERSION}
docker kill serving_base
docker tag $USER/sentiment_serving ${IMAGE_NAME}:${MODEL_VERSION}

#Get deployment name from kubectl (or yaml file we used to deploy).
DEPLOYMENT_NAME=sentiment-deployment
kubectl set image deployment.v1.apps/${DEPLOYMENT_NAME} sentiment-container=${IMAGE_NAME}:${MODEL_VERSION} --record
#View description to see update info (see events to note changes based on edits.)
kubectl describe deployments $DEPLOYMENT_NAME

```



