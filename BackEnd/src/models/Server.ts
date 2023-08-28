import mongoose from 'mongoose';
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
const domain = 'learn-ocaml.org';

var ServerSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  description: String,
  body: String,
  vue: String,
  volume: String,
  active: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: String,
  url: String
}, {
  timestamps: true,
  methods: {
    slugify() {
      // this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
      (this as any).slug = slug((this as any).title);
    },

    toJSONFor(user) {
      return {
        slug: (this as any).slug,
        title: (this as any).title,
        description: (this as any).description,
        body: (this as any).body,
        createdAt: (this as any).createdAt,
        updatedAt: (this as any).updatedAt,
        author: (this as any).author.toProfileJSONFor(user),
        active: (this as any).active,
        volume: (this as any).volume,
        token: (this as any).token,
        url: (this as any).url
      };
    }
  }
});

ServerSchema.plugin(uniqueValidator, { message: 'is already taken' });

ServerSchema.pre('validate', function (next) {
  if (!(this as any).slug) {
    (this as any).slugify();
  }
  (this as any).url = (this as any).author.username + '.' + (this as any).slug + '.' + domain;
  next();
});

export const Server = mongoose.model('Server', ServerSchema);
