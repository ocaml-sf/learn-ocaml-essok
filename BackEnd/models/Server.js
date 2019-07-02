var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');
const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApiDeploy = kc.makeApiClient(k8s.AppsV1Api);
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiIngress = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
k8sApiIngress.defaultHeaders = {
  'Content-Type': 'application/strategic-merge-patch+json',
  ...k8sApiIngress.defaultHeaders,
};

var ServerSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z]+$/, 'is invalid'], index: true },
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

ServerSchema.methods.createNamespacedDeployment = function (deployment) {
  k8sApiDeploy.createNamespacedDeployment('default', deployment).then(
    (response) => {
      console.log('Created deployment ' + this.title);
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.readNamespacedDeployment = function () {
  k8sApiDeploy.readNamespacedDeployment(this.title, 'default').then((response) => {
    console.log('Namespace read');
  },
    (err) => {
      console.log('Error!: ' + err);
    });
};

ServerSchema.methods.createNamespacedService = function (service) {
  k8sApi.createNamespacedService('default', service).then(
    (response) => {
      console.log('Service created');
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.patchNamespacedIngress = function (response) {
  k8sApiIngress.patchNamespacedIngress('ingress', 'default', { spec: response.body.spec }).then(
    (response) => {
      console.log('Ingress updated');
    },
    (err) => {
      console.log('Error!: ' + JSON.stringify(err));
    },
  );
};

ServerSchema.methods.createNamespacedIngress = function (path) {
  k8sApiIngress.readNamespacedIngress('ingress', 'default', 'true').then(
    (response) => {
      console.log('Ingress read');
      response.body.spec.rules[0].http.paths.push(path);
      console.log('preparing file for ingress');
      this.patchNamespacedIngress(response);
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.deleteNamespacedIngress = function () {
  k8sApiIngress.readNamespacedIngress('ingress', 'default', 'true').then(
    (response) => {
      var paths = response.body.spec.rules[0].http.paths;
      console.log('Ingress read');
      this.removeIngressFile(paths);
      this.patchNamespacedIngress(response);
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.removeIngressFile = function (paths) {
  for (let index = 0; index < paths.length; index++) {
    if (paths[index].backend.serviceName === this.title) {
      paths.splice(index, 1);
    }
  }
  console.log('preparing file for ingress');
};

ServerSchema.methods.deleteNamespacedService = function () {
  k8sApi.deleteNamespacedService(this.title, 'default').then((response) => {
    console.log('delete service ok');
  },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.deleteNamespacedDeployment = function () {
  k8sApiDeploy.deleteNamespacedDeployment(this.title, 'default').then((response) => {
    console.log('delete depoyment ok');
  },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
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
    vue: 'Arborescence de la vue',

  };
};

mongoose.model('Server', ServerSchema);
