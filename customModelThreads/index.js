const { CustomThread } = require('./models');
const {
  router, mean, wordCount, addSentimentAnalysis, getKids,
} = require('./router');

module.exports = {
  CustomThread, router, mean, wordCount, addSentimentAnalysis, getKids,
};
