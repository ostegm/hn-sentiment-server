/* eslint-env mocha */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, runServer, closeServer } = require('../index');
const { Thread, mean, wordCount } = require('../threads');
const { TEST_DATABASE_URL } = require('../config');

process.env.NODE_ENV = 'test';
const { expect } = chai;
const should = chai.should();
chai.use(chaiHttp);


function seedCollection() {
  const seedKids = [];
  for (let i = 1; i <= 10; i++) {
    seedKids.push({
      by: `${faker.name.firstName()} ${faker.name.lastName()}`,
      id: i,
      text: faker.lorem.text(),
      wordCount: 100,
      documentSentiment: {
        score: 0,
        magnitude: 1.0,
      },
    });
  }
  const seedThread1 = {
    id: 0,
    avgWordCount: 100,
    avgSentiment: 0.0,
    avgMagnitude: 0,
    kids: seedKids,
    by: `${faker.name.firstName()} ${faker.name.lastName()}`,
    descendants: 10,
    title: faker.lorem.sentence(),
    url: 'adawdawdad',
    lastUpdated: new Date(),
  };

  const seedThread2 = {
    id: 8863,
    avgWordCount: 100,
    avgSentiment: 0.0,
    avgMagnitude: 0,
    kids: [],
    lastUpdated: new Date(1900),
  };
  // this will return a promise
  return Thread.insertMany([seedThread1, seedThread2]);
}


function clearCollection() {
  return new Promise((resolve, reject) => {
    Thread.deleteMany({})
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

describe('/api/threads', function () {
  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  after(function () {
    return closeServer();
  });

  beforeEach(function () {
    return seedCollection();
  });

  afterEach(function () {
    return clearCollection();
  });

  it('should 200 on GET requests for IDs in the db', async function () {
    this.timeout(5000);
    const res = await chai.request(app).get('/api/threads/0');
    res.should.have.status(200);
    res.should.be.json;
    const expectedKeys = [
      'by', 'descendants', 'id', 'kids', 'title', 'url',
      'avgWordCount', 'avgSentiment', 'avgMagnitude', 'lastUpdated'];
    expect(res.body).to.include.keys(expectedKeys);
    res.body.kids.forEach((kid) => {
      expect(kid).to.be.a('object');
      expect(kid).to.include.keys(['by', 'id', 'text', 'wordCount', 'documentSentiment']);
      expect(kid.documentSentiment.score).to.be.at.least(-1);
      expect(kid.documentSentiment.score).to.be.at.most(1);
    });
  });

  it('should Update threads older than 1 min', async function () {
    this.timeout(5000);
    const res = await chai.request(app).get('/api/threads/8863');
    res.body.kids.length.should.be.at.least(32);
  });

  it('should 500 on GET requests for invalid IDs ', async function () {
    this.timeout(5000);
    const res = await chai.request(app).get('/api/threads/XXXX');
    res.should.have.status(500);
  });
});


describe('Utility function tests', function () {
  it('Should return zero wordcount for an empty string', function () {
    const cnt = wordCount('');
    cnt.should.equal(0);
  });

  it('Should return correct wordcount for a sentence', function () {
    const cnt = wordCount('this sentence has five words');
    cnt.should.equal(5);
  });

  it('Should correctly calculate mean for an array of numbers.', function () {
    const calc = mean([3, 3, 6, 12]);
    calc.should.equal(6);
  });
});
