var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
    type: String,
    /*error, general, bin (database)*/
    action: String,
    message: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server' }
}, { timestamps: true });

LogSchema.methods.toJSONFor = function (user) {
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

mongoose.model('Log', LogSchema);
