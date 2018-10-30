const axios = require('axios');
const express = require('express');
const { CustomThread } = require('./models');
const { HACKER_NEWS_API, NODE_ENV, CUSTOM_MODEL_ADDRESS } = require('../config');

const router = express.Router();

const mean = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
const wordCount = (someString) => {
  if (!someString) {
    return 0;
  }
  return someString.trim().split(/\s+/).length;
};

const hnRequest = (itemId) => {
  return axios.get(`${HACKER_NEWS_API}${itemId}.json`);
};

const addSentimentAnalysis = async (kid, nodeEnv = NODE_ENV) => {
  kid.wordCount = wordCount(kid.text);
  if (nodeEnv === 'test') {
    kid.documentSentiment = {
      score: Math.random(),
      magnitude: Math.random() * 100,
    };
    return kid;
  }
  // Otherwise, we are in prod, make a real request.
  data = {
    instances: [kid.text],
  };
  const response = await axios.post(CUSTOM_MODEL_ADDRESS, data);
  const sentiment = response.data.predictions[0].scores[1]
  kid.documentSentiment = {
    score: sentiment,
    magnitude: null,
  };
  return kid;
};

const getKids = async (kidIds) => {
  let kids = (await axios.all(kidIds.map(hnRequest))).map(k => k.data);
  // Keep only kids with text.
  kids = kids.filter(k => k.text);
  const kidsWithSentiments = await Promise.all(kids.map(async (kid) => {
    const sentiment = await addSentimentAnalysis(kid);
    return sentiment;
  }));
  return kidsWithSentiments;
};

const addThread = async (threadId) => {
  const parent = await hnRequest(threadId);
  const threadData = parent.data;
  if (threadData.kids) {
    // Replace array of thread Id's with an array of objects from HN News API.
    const kids = await getKids(threadData.kids);
    threadData.kids = kids;
    threadData.avgWordCount = mean(kids.map(kid => kid.wordCount));
    threadData.avgSentiment = mean(kids.map(kid => kid.documentSentiment.score));
    threadData.avgMagnitude = mean(kids.map(kid => kid.documentSentiment.magnitude));
  }
  return CustomThread.create(threadData);
};


const updateThread = async (thread) => {
  const updatedKidIds = (await hnRequest(thread.id)).data.kids;
  const existingKidIds = thread.kids.map(kid => kid.id);
  const missingKidIds = updatedKidIds.filter(id => existingKidIds.indexOf(id) === -1);
  if (!missingKidIds) {
    return thread;
  }
  // Get missing comments, append to existing kids, then update record.
  const missingKids = await getKids(missingKidIds);
  thread.kids = thread.kids.concat(missingKids);
  return CustomThread.findOneAndUpdate(
    { id: thread.id },
    { $set: { kids: thread.kids } },
    { new: true },
  );
};

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const isNumber = /^\d+$/.test(id);
  if (!isNumber) {
    res.status(500).json({ error: 'Thread id must be an integer.' });
    return;
  }
  try {
    let thread = await CustomThread.findOne({ id });
    if (!thread) {
      thread = await addThread(id);
    }
    if ((new Date() - thread.lastUpdated) > 60000) {
      thread = await updateThread(thread);
    }
    res.json(thread.serialize());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong' });
  }
});


module.exports = {
  router, mean, wordCount, addSentimentAnalysis, getKids,
};

