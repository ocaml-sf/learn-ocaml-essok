var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;
const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

var UserSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  email: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
  description: String,
  place: String,
  goal: String,
  admin: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  authorized: { type: Boolean, default: false },
  image: String,
  hash: String,
  salt: String
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' });

UserSchema.methods.validPassword = function (password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJWT = function () {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
};

UserSchema.methods.isAdmin = function () {
  return this.admin;
};

UserSchema.methods.createNamespace = function (namespace) {
  k8sApi.createNamespace(namespace).then(
    (response) => {
      console.log('Created namespace');
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

UserSchema.methods.readNamespace = function (name) {
  k8sApi.readNamespace(name).then(
    (response) => {
      console.log('Read namespace');
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

UserSchema.methods.findAllUsers = function (query, limit, offset) {

  if (this.isAdmin()) {

    return Promise.all([
      mongoose.model('User').find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createdAt: 'desc' })
        .exec(),
      mongoose.model('User').countDocuments(query).exec(),
    ]);
  }
};

UserSchema.methods.findAnUser = function (author) {
  return Promise.all([
    author ? mongoose.model('User').findOne({ username: author }) : null,
  ]);
};

UserSchema.methods.findAllServersOfAnUser = function (query_, author, payload) {

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
    query.active = query_.active;
  }

  if (this.isAdmin()) {
    if (author) {
      query.author = author._id;
    }
  }
  else {
    query.author = payload.id;
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
};

UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    description: this.description,
    place: this.place,
    goal: this.goal,
    admin: this.admin,
    image: this.image,
    active: this.active,
    authorized: this.authorized,
  };
}

UserSchema.methods.toProfileJSONFor = function (user) {
  return {
    email: this.email,
    username: this.username,
    description: this.description,
    place: this.place,
    goal: this.goal,
    active: this.active,
    authorized: this.authorized,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
  };
};

mongoose.model('User', UserSchema);
