import mongoose from 'mongoose';
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../configs').secret;

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true
  },
  description: String,
  place: String,
  goal: String,
  admin: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  authorized: { type: Boolean, default: false },
  image: String,
  hash: String,
  processing: { type: Boolean, default: false },
  salt: String
}, {
  timestamps: true,
  methods: {
    validPassword(password) {
      var hash = crypto.pbkdf2Sync(password, (this as any).salt, 10000, 512, 'sha512').toString('hex');
      return (this as any).hash === hash;
    },

    setPassword(password) {
      (this as any).salt = crypto.randomBytes(16).toString('hex');
      (this as any).hash = crypto.pbkdf2Sync(password, (this as any).salt, 10000, 512, 'sha512').toString('hex');
    },

    generateJWT() {
      var today = new Date();
      var exp = new Date(today);
      exp.setDate(today.getDate() + 60);

      return jwt.sign({
        id: this._id,
        username: (this as any).username,
        exp: (exp.getTime() / 1000),
      }, secret);
    },

    isAdmin() {
      return (this as any).admin;
    },

    startProcessing() {
      var user = this;
      return new Promise(function(resolve, reject) {
        (user as any).processing = true;
        if ((user as any).processing === true) {
          user.save().then(() => {
            return resolve(true);
          })
        }
      });
    },

    endProcessing() {
      var user = this;
      return new Promise(function(resolve, reject) {
        (user as any).processing = false;
        if ((user as any).processing === false) {
          user.save().then(() => {
            return resolve(true);
          })
        }
      });
    },

    findAllUsers(query, limit, offset) {

      if ((this as any).isAdmin()) {

        return Promise.all([
          mongoose.model('User').find(query)
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({ createdAt: 'desc' })
            .exec(),
          mongoose.model('User').countDocuments(query).exec(),
        ]);
      }
    },

    findAllLogs(query, limit, offset) {
      if ((this as any).isAdmin()) {

        return Promise.all([
          mongoose.model('Log').find(query)
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({ createdAt: 'desc' })
            .exec(),
          mongoose.model('Log').countDocuments(query).exec(),
        ]);
      }
    },

    findAnUser(author) {
      return Promise.all([
        author ? mongoose.model('User').findOne({ username: author }) : null,
      ]);
    },

    findAllServersOfAnUser(query_, author, payload) {

      var query = {};
      var limit = 20;
      var offset = 0;
      if (typeof query_.limit !== 'undefined') {
        limit = query_.limit;
      }

      if (typeof query_.offset !== 'undefined') {
        offset = query_.offset;
      }
      if (typeof query_.active !== 'undefined') {
        (query as any).active = query_.active;
      }

      if ((this as any).isAdmin()) {
        if (author) {
          (query as any).author = author._id;
        }
      } else {
        (query as any).author = payload.id;
      }
      return Promise.all([
        mongoose.model('Server').find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: 'desc' })
          .populate('author')
          .exec(),
        mongoose.model('Server').countDocuments(query).exec(),
      ]);
    },

    toAuthJSON() {
      return {
        username: (this as any).username,
        email: (this as any).email,
        token: (this as any).generateJWT(),
        description: (this as any).description,
        place: (this as any).place,
        goal: (this as any).goal,
        admin: (this as any).admin,
        image: (this as any).image,
        active: (this as any).active,
        processing: (this as any).processing,
        authorized: (this as any).authorized,
      };
    },

    toProfileJSONFor() {
      return {
        email: (this as any).email,
        username: (this as any).username,
        description: (this as any).description,
        place: (this as any).place,
        goal: (this as any).goal,
        active: (this as any).active,
        authorized: (this as any).authorized,
        processing: (this as any).processing,
        image: (this as any).image || 'https://essok.learn-ocaml.org/assets/images/default_avatar.jpg',
      };
    }
  }
});

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' });

export const User = mongoose.model('User', UserSchema);
