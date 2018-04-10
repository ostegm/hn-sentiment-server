'use strict';

const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/*', (req, res) => {
  const test = process.env.TEST_ENV_VAR || 'nope';
  res.json({ ok: test });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = { app };
