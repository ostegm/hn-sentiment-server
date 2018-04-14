const mongoose = require('mongoose');

mongoose.Promise = global.Promise;


const ChildSchema = mongoose.Schema({
  _id: false,
  id: { type: Number, required: true },
  by: { type: String },
  text: { type: String },
  documentSentiment: {
    score: { type: Number },
    magnitude: { type: Number },
  },
});

const ThreadSchema = mongoose.Schema(
  {
    id: { type: Number, required: true },
    kids: [ChildSchema],
  },
  { timestamps: { updatedAt: 'lastUpdated' } },
);

ThreadSchema.methods.serialize = function () {
  return {
    id: this.id,
    kids: this.kids,
    lastUpdated: this.lastUpdated,
    documentSentiment: this.documentSentiment,
  };
};


const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = { Thread };
