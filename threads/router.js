const axios = require('axios');
const express = require('express');
const language = require('@google-cloud/language');
const { Thread } = require('./models');
const { HACKER_NEWS_API } = require('../config');

const router = express.Router();
const sentimentClient = new language.LanguageServiceClient();

const hnRequest = (itemId) => {
  return axios.get(`${HACKER_NEWS_API}${itemId}.json`);
};

const addSentimentAnalysis = async (kid) => {
  const document = {
    content: kid.text,
    type: 'PLAIN_TEXT',
  };
  const results = await sentimentClient.analyzeSentiment({ document });
  kid.documentSentiment = results[0].documentSentiment;
  return kid;
};

const getKids = async (kidIds) => {
  const kids = (await axios.all(kidIds.map(hnRequest))).map(k => k.data);
  return kids.map(addSentimentAnalysis);
};

const addThread = async (threadId) => {
  const parent = await hnRequest(threadId);
  const threadData = parent.data;
  if (threadData.kids) {
    // Replace array of thread Id's with an array of objects from HN News API.
    threadData.kids = await getKids(threadData.kids);
  }
  return Thread.create(threadData);
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
  return Thread.findOneAndUpdate(
    { id: thread.id },
    { $set: { kids: thread.kids } },
    { new: true },
  );
};


// Get all books for a specific userId.
router.get('/:id', async (req, res) => {
  // Protected by JWT auth, so all requests should have a user object.
  try {
    const { id } = req.params;
    let thread = null // || await Thread.findOne({ id }); // TODO Remove this to use cached docs.
    if (!thread) {
      thread = await addThread(id);
    }
    if ((new Date() - thread.lastUpdated) > 0) {
      thread = await updateThread(thread);
    }
    res.json(thread.serialize());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong' });
  }
});


module.exports = { router };
