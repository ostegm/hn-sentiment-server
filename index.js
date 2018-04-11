'use strict';

require('dotenv').config();
const morgan = require('morgan');
const mongoose = require('mongoose');
const express = require('express');
const { DATABASE_URL } = require('./config');
const { router: threadsRouter, Thread } = require('./threads');

mongoose.Promise = global.Promise;

const app = express();
const PORT = process.env.PORT || 3000;


app.use(morgan('common'));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

app.get('/', (req, res) => {
  const test = process.env.TEST_ENV_VAR || 'nope';
  res.json({ ok: test });
});

// Routers
app.use('/api/threads/', threadsRouter);


app.use('*', (req, res) => {
  return res.status(404).json({ status: 404, message: 'Not Found' });
});


// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
