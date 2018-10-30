exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/my-library';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-my-library';
exports.NODE_ENV = process.env.NODE_ENV || 'production';
exports.PORT = process.env.PORT || 8080;
exports.HACKER_NEWS_API = 'https://hacker-news.firebaseio.com/v0/item/';
exports.CUSTOM_MODEL_ADDRESS = 'http://35.226.186.209:8501/v1/models/sentiment:predict';