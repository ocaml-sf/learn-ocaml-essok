var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');
const k8s = require('@kubernetes/client-node');

var ServerSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  body: String,
  vue: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ServerSchema.plugin(uniqueValidator, { message: 'is already taken' });

ServerSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify();
  }

  next();
});

ServerSchema.methods.slugify = function () {
  this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

ServerSchema.methods.toJSONFor = function (user) {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
  k8sApi.listNamespacedDeployment('default').then((res) => {
    deployment = (res.body);
  }, (err) => {
    console.log('Error!: ' + err);
  });
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: this.author.toProfileJSONFor(user),
    vue: 'Arborescence de la vue',

  };
};

mongoose.model('Server', ServerSchema);
