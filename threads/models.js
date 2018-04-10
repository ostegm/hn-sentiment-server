const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ThreadSchema = mongoose.Schema({
  threadId: {type: Number, required: true},
});

ThreadSchema.methods.serialize = function() {
  return {
    id: this._id,
    threadId: this.threadId,
  };
};


const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = { Thread };
