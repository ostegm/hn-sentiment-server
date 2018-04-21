const { Thread } = require('./models');
const {
  router, mean, wordCount, addSentimentAnalysis,
} = require('./router');

module.exports = {
  Thread, router, mean, wordCount, addSentimentAnalysis,
};
