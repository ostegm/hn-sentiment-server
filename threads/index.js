const { Thread } = require('./models');
const {
  router, mean, wordCount, addSentimentAnalysis, getKids,
} = require('./router');

module.exports = {
  Thread, router, mean, wordCount, addSentimentAnalysis, getKids,
};
