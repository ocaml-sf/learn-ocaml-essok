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
const k8sApiJobs = kc.makeApiClient(k8s.BatchV1Api);

k8sApiIngress.defaultHeaders = {
  'Content-Type': 'application/strategic-merge-patch+json',
  ...k8sApiIngress.defaultHeaders,
};
var swiftClient = require('../Client/swiftClient');
var OS = require('../Client/OS');

var ServerSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  description: String,
  body: String,
  vue: String,
  volume: String,
  active: { type: Boolean, default: false },
  processing: { type: Boolean, default: false },
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
      console.log('Created deployment ' + this.slug);
    },
    (err) => {
      console.log('Error!: ' + JSON.stringify(err));
    },
  );
};

ServerSchema.methods.readNamespacedDeployment = function () {
  k8sApiDeploy.readNamespacedDeployment(this.slug, 'default').then((response) => {
    console.log('Namespace read');
  },
    (err) => {
      console.log('Error!: ' + JSON.stringify(err));
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
  k8sApiIngress.patchNamespacedIngress('learn-ocaml', 'default', { spec: response.body.spec }).then(
    (response) => {
      console.log('Ingress updated');
    },
    (err) => {
      console.log('Error!: ' + JSON.stringify(err));
    },
  );
};

ServerSchema.methods.createNamespacedIngress = function (rule) {
  k8sApiIngress.readNamespacedIngress('learn-ocaml', 'default', 'true').then(
    (response) => {
      console.log('Ingress read');
      response.body.spec.rules.push(rule);
      console.log('preparing file for ingress');
      this.patchNamespacedIngress(response);
    },
    (err) => {
      console.log('Error!: ' + JSON.stringify(err));
    },
  );
};

ServerSchema.methods.removekubelink = function (eventEmitter, server) {
  eventEmitter.on('begin-unlink', function () {
    server.deleteNamespacedIngress();
    eventEmitter.emit('Ingress_deleted');
  });
  eventEmitter.on('Ingress_deleted', function () {
    server.deleteNamespacedService();
    eventEmitter.emit('Service_deleted');
  });
  eventEmitter.on('Service_deleted', function () {
    server.deleteNamespacedDeployment();
  });
  eventEmitter.emit('begin-unlink');
};

ServerSchema.methods.createkubelink = function () {

  console.log('this.volume = ' + this.volume);

  var slugged = this.slug;
  var deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: slugged,
      labels: {
        app: slugged
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: slugged
        }
      },
      template: {
        metadata: {
          labels: {
            app: slugged
          }
        },
        spec: {
          containers: [
            {
              name: 'learn-ocaml',
              image: 'ocamlsf/learn-ocaml:latest',
              ports: [
                {
                  containerPort: 8080
                }
              ],
              volumeMounts: [
                {
                  name: slugged,
                  mountPath: '/repository/',
                  subPath: 'repository',
                },
                {
                  name: slugged,
                  mountPath: '/sync/',
                  subPath: 'sync',
                }
              ]
            }
          ],
          securityContext: {
            fsGroup: 1000
          },
          volumes: [
            {
              name: slugged,
              cinder: {
                volumeID: this.volume,
                fsType: 'ext4'
              }
            }
          ]
        }
      }
    }
  };


  this.createNamespacedDeployment(deployment);

  var service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: slugged,
      labels: {
        app: slugged
      }
    },
    spec: {
      type: 'ClusterIP',
      selector: {
        app: slugged
      },
      ports: [
        {
          name: 'http',
          port: 80,
          targetPort: 8080
        }
      ]
    }
  }

  this.createNamespacedService(service);

  var rule = {
    host: this.author.username + '.' + slugged + '.learnocaml.org',
    http: {
      paths: [{
        backend: {
          serviceName: slugged,
          servicePort: 80
        }
      }]
    }
  }
  this.createNamespacedIngress(rule);

};

ServerSchema.methods.deleteNamespacedIngress = function () {
  k8sApiIngress.readNamespacedIngress('learn-ocaml', 'default', 'true').then(
    (response) => {
      var rules = response.body.spec.rules;
      console.log('Ingress read');
      this.removeIngressFile(rules);
      this.patchNamespacedIngress(response);
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.removeIngressFile = function (rules) {
  for (let index = 0; index < rules.length; index++) {
    if (rules[index].http.paths[0].backend.serviceName === this.slug) {
      rules.splice(index, 1);
    }
  }
  console.log('preparing file for ingress');
};

ServerSchema.methods.deleteNamespacedService = function () {
  k8sApi.deleteNamespacedService(this.slug, 'default').then((response) => {
    console.log('delete service ok');
  },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.deleteNamespacedDeployment = function () {
  k8sApiDeploy.deleteNamespacedDeployment(this.slug, 'default').then((response) => {
    console.log('delete depoyment ok');
  },
    (err) => {
      console.log('Error!: ' + err);
    },
  );
};

ServerSchema.methods.listPersistentVolume = function (server) {
  return new Promise(function (resolve, reject) {
    k8sApi.listPersistentVolume().then((response) => {
      response.body.items.forEach(element => {
        if (element.spec.claimRef.name === server.slug) {
          console.log('item bound found ' + element);
          console.log('Volume ' + server.slug + ' Bound ' + element.spec.cinder.volumeID);
          server.volume = element.spec.cinder.volumeID;
          console.log('volume recu  = ' + server.volume);
          return resolve(server);
        }

      });
    },
      (err) => {
        console.log('Error!: ' + err);
        return reject(err);
      },
    );
  });
};

ServerSchema.methods.createPersistentVolumeAndLinkKube = function (server) {

  var pvc = {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: this.slug,
      namespace: 'default'
    },
    spec: {
      accessModes: [
        'ReadWriteOnce'
      ],
      resources: {
        requests: {
          storage: '1Gi'
        }
      },
      storageClassName: 'cinder-classic',
      volumeMode: 'Filesystem'
    }
  };

  var serverCreated = false;
  k8sApi.createNamespacedPersistentVolumeClaim('default', pvc)
    .then((response) => {
      console.log('Volume ' + server.slug + ' claimed');
      k8sApi.listNamespacedPersistentVolumeClaim('default');
      var serverInCreation = setInterval(function () {
        k8sApi.listNamespacedPersistentVolumeClaim('default').then((response) => {
          response.body.items.forEach(element => {
            if (element.metadata.name === server.slug) {
              console.log('item found ' + element);
              status = element.status.phase;
              console.log('status found ' + status);
              if (element.status.phase === 'Bound') {
                serverCreated = true;
              }
            }
          });
          if (serverCreated === true) {
            console.log('status bound found !');
            server.listPersistentVolume(server).then((response) => {
              console.log('after bonding' + response);
              server.volume = response.volume;
              clearInterval(serverInCreation);

              server.backupUpload().then((response) => {
                server.createkubelink();

              },
                (err) => {
                  console.log(err);
                  // abort all
                }
              );

              server.active = !server.active;
              server.save();
            }, (err) => {
              console.log('Error!: ' + err);
            });
          }
        }, (err) => {
          console.log('Error!: ' + err);
        });
      }, 2000);
    });
};


ServerSchema.methods.backup = function (backupType, backupCommand) {

  var slugged = this.slug;

  var job = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: backupType + "-" + this.slug
    },
    spec: {
      ttlSecondsAfterFinished: 0,
      template: {
        spec: {
          containers: [
            {
              image: "python",
              name: this.slug,
              env: [
                {
                  name: "OS_AUTH_URL",
                  value: OS.authUrl
                },
                {
                  name: "OS_IDENTIY_API_VERSION",
                  value: OS.identityApiVersion
                },
                {
                  name: "OS_USERNAME",
                  value: OS.username
                },
                {
                  name: "OS_PASSWORD",
                  value: OS.password
                },
                {
                  name: "OS_TENANT_ID",
                  value: OS.tenantID
                },
                {
                  name: "OS_REGION_NAME",
                  value: OS.region
                }
              ],
              command: [
                '/bin/sh'
              ],
              args: [
                '-c',
                backupCommand
              ],
              volumeMounts: [
                {
                  name: this.slug,
                  mountPath: "/volume/"
                }
              ]
            },
          ],
          restartPolicy: "OnFailure",
          securityContext: {
            fsGroup: 1000
          },
          volumes: {
            name: this.slug,
            cinder: {
              volumeID: "158178a6-0b6f-4dae-be1f-bc97e360e978",
              fsType: ext4
            }
          }
        }
      }
    }
  };

  return new Promise(function (resolve, reject) {
    k8sApiJobs.createNamespacedJob('default', job).then((response) => {

      var jobInProgress = setInterval(function () {
        k8sApiJobs.listNamespacedJob('default').then((response) => {
          response.body.items.forEach(item => {
            if (item.metadata.name === backupType + "-" + slugged) {
              console.log('job found');
              console.log('job succeeded : ' + item.status.succeeded);
              if (item.status.succeeded !== 0) {
                console.log('job done');
                clearInterval(jobInProgress);
                resolve('success');
              }
            }
          });
        },
          (err) => {
            console.log('Error!: ' + err);
            reject(err);
          }
        );
      }, 5000);
    },
      (err) => {
        console.log('Error!: ' + err);
        reject(err);
      }
    );
  });
};

ServerSchema.methods.backupUpload = function () {
  var backupType = 'upload';
  var backupCommand = 'pit install --no-cache python-swiftclient python-keystoneclient;\
  swift download ' + this.slug + ' -D /volume/';
  return this.backup(backupType, backupCommand);
};

ServerSchema.methods.backupDownload = function () {
  var backupType = 'download';
  var backupCommand = 'pit install --no-cache python-swiftclient python-keystoneclient;\
  rm -r /volume/lost+found;\
  swift upload ' + this.slug + ' /volume/ --object-name /';
  return this.backup(backupType, backupCommand);
};

ServerSchema.methods.deleteNamespacedPersistentVolumeClaim = function () {
  k8sApi.deleteNamespacedPersistentVolumeClaim(this.slug, 'default').then((response) => {
    console.log('volume ' + this.slug + ' deleted');
  },
    (err) => {
      console.log('Error!: ' + err);
    }
  );
}

ServerSchema.methods.createSwiftContainer = function () {

  var container = {
    name: this.slug,
    metadata: {}
  }
  swiftClient.createContainer(container, function (err, container) {
    console.log(container);
    console.log(err);
    return container;
  });
};

//may be useful one day
ServerSchema.methods.isProcessing = function () {

  server = this;
  return new Promise(function (resolve, reject) {

    var processInProgress = setInterval(function () {
      if (server.processing === false) {
        clearInterval(processInProgress);
        resolve('ok');
      }
    }, 2000);
  });

};

ServerSchema.methods.getSwiftContainer = function () {
  var slug = this.slug;
  return new Promise(function (resolve, reject) {
    swiftClient.getContainers(function (err, containers) {
      containers.forEach(element => {
        if (element.name === slug) {
          return resolve(element);
        }
      });
      return reject(err);
    });
  });
};

ServerSchema.methods.destroySwiftContainer = function () {
  this.getSwiftContainer().then(function (response) {
    swiftClient.destroyContainer(response, function (err, result) {
      return result;
    });
  })
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
    processing: this.processing
  };
};

mongoose.model('Server', ServerSchema);
