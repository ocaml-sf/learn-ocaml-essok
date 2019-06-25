var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');
var Server = mongoose.model('Server');

var VueSchema = new mongoose.Schema({
    title: String,
    body: { type: mongoose.Schema.Types.Array },
    server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

VueSchema.methods.toJSONFor = function (user) {
    return {
        title: this.title,
        body: this.body,
        server: this.server.toJSONFor(user),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('Vue', VueSchema);
