/* eslint-env mocha */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, runServer, closeServer } = require('../index');
const { TEST_DATABASE_URL } = require('../config');

process.env.NODE_ENV = 'test';

const { expect } = chai;
const should = chai.should();
chai.use(chaiHttp);

describe('High level server tests', function () {
  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  after(function () {
    return closeServer();
  });

  it('should 200 on GET /threads/recent', async function () {
    const res = await chai.request(app).get('/api/threads/recent');
    res.should.have.status(200);
    res.should.be.json;
  });

  it('should 404 on GET requests for invalid paths ', async function () {
    const res = await chai.request(app).get('/api/XXXX');
    res.should.have.status(404);
  });
});
