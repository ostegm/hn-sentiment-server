const axios = require('axios');
const express = require('express');
const { Thread } = require('./models');
const { HACKER_NEWS_API } = require('../config');
const router = express.Router();

const hnRequest = (itemId) => {
  return axios.get(`${HACKER_NEWS_API}${itemId}.json`);
};

const getKids = (kidIds) => {
  return axios.all(kidIds.map(hnRequest));
};

const addThread = async (threadId) => {
  const parent = await hnRequest(threadId);
  const threadData = parent.data;
  if (threadData.kids) {
    // Replace array of thread Id's with an array of objects from HN News API.
    const kids = await getKids(threadData.kids);
    threadData.kids = kids.map(kid => kid.data);
  }
  return Thread.create(threadData);
};

// Get all books for a specific userId.
router.get('/:id', async (req, res) => {
  // Protected by JWT auth, so all requests should have a user object.
  try {
    const { id } = req.params;
    let thread = await Thread.findOne({ id });
    if (!thread) {
      thread = await addThread(id);
    }
    res.json(thread.serialize());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong' });
  }
});


module.exports = { router };
