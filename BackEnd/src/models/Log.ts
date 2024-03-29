var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
  type: String,
  /*error, general, bin (database)*/
  action: String,
  message: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server' }
}, { timestamps: true });

LogSchema.methods.toJSONFor = function (user : any) {
  return {
    type: this.type,
    action: this.action,
    message: this.message,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: this.author.toProfileJSONFor(user),
    server: this.server.toJSONFor(user),
  };
};

export const Log = mongoose.model('Log', LogSchema);
