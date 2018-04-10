const express = require('express');
const bodyParser = require('body-parser');
const { Thread } = require('./models');

const router = express.Router();
const jsonParser = bodyParser.json();


// Get all books for a specific userId.
router.get('/:threadId', (req, res) => {
  // Protected by JWT auth, so all requests should have a user object.
  const { threadId } = req.params;
  return Thread.findOne({ threadId })
    .then((thread) => {
      console.log(thread);
      res.json(thread.serialize());
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'something went wrong' });
    });
});


// Don't forget the jsonParser
// router.put('/:id', jsonParser, (req, res) => {
// }

module.exports = { router };
