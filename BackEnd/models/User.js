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
  };
}

UserSchema.methods.toProfileJSONFor = function (user) {
  return {
    username: this.username,
    description: this.description,
    place: this.place,
    goal: this.goal,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
  };
};

mongoose.model('User', UserSchema);
