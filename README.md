# hn-sentiment-server

A node server built to serve the [HN React Client running here](https://www.dabbl.io).

## About

The server takes requests from the client and either returns existing data from the database or adds new data by combining raw data from the Hacker News API with sentiment analysis from a machine learned sentiment model. Currently supports two models:

1. The Google Cloud natural language API (/api/threads/gcp/...)
2. A custom model trained using transfer learning via TF Hub  (/api/threads/custom/...)

For more on the custom model training and deployment, see the [custom_model directory](https://github.com/ostegm/hn-sentiment-server/tree/master/custom_model).