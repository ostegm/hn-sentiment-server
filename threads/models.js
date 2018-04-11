const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const childSchema = mongoose.Schema({
  _id: false,
  id: { type: Number, required: true },
  by: { type: String },
  text: { type: String },
});

const ThreadSchema = mongoose.Schema({
  id: { type: Number, required: true },
  kids: [childSchema],
});

ThreadSchema.methods.serialize = function () {
  return {
    id: this.id,
    kids: this.kids,
  };
};


const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = { Thread };
