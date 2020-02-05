var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');

var ServerSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  description: String,
  body: String,
  vue: String,
  volume: String,
  active: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: String
}, { timestamps: true });

ServerSchema.plugin(uniqueValidator, { message: 'is already taken' });

ServerSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify();
  }
  next();
});

ServerSchema.methods.slugify = function () {
  // this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
  this.slug = slug(this.title);
};

ServerSchema.methods.toJSONFor = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: this.author.toProfileJSONFor(user),
    active: this.active,
    volume: this.volume,
    token: this.token
  };
};

mongoose.model('Server', ServerSchema);
