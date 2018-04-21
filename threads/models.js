const mongoose = require('mongoose');

mongoose.Promise = global.Promise;


const ChildSchema = mongoose.Schema({
  _id: false,
  id: { type: Number, required: true },
  by: { type: String },
  type: { type: String },
  text: { type: String },
  time: { type: Number },
  wordCount: { type: Number },
  documentSentiment: {
    score: { type: Number },
    magnitude: { type: Number },
  },
});

const ThreadSchema = mongoose.Schema(
  {
    id: { type: Number, required: true },
    by: { type: String },
    descendants: { type: String },
    score: { type: Number },
    time: { type: Number },
    title: { type: String },
    type: { type: String },
    url: { type: String },
    avgWordCount: { type: Number, default: 0.0 },
    avgSentiment: { type: Number, default: 0.0 },
    avgMagnitude: { type: Number, default: 0.0 },
    kids: [ChildSchema],
  },
  { timestamps: { updatedAt: 'lastUpdated' } },
);

ThreadSchema.methods.serialize = function () {
  return {
    id: this.id,
    lastUpdated: this.lastUpdated,
    documentSentiment: this.documentSentiment,
    avgWordCount: this.avgWordCount,
    avgSentiment: this.avgSentiment,
    avgMagnitude: this.avgMagnitude,
    kids: this.kids,
    by: this.by,
    descendants: this.descendants,
    score: this.score,
    time: this.time,
    type: this.type,
    title: this.title,
    url: this.url,
  };
};


const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = { Thread };
