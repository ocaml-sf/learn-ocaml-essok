var router = require('express').Router();
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var User = mongoose.model('User');
var auth = require('../auth');

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
// Preload server objects on routes with ':server'
router.param('server', function (req, res, next, slug) {
  Server.findOne({ slug: slug })
    .populate('author')
    .then(function (server) {
      if (!server) { return res.sendStatus(404); }

      req.server = server;
      title = server.title;

      return next();
    }).catch(next);
});

router.get('/', auth.required, function (req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
  ]).then(function (results) {
    var author = results[0];

    if (author) {
      query.author = author._id;
    }

    return Promise.all([
      Server.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createdAt: 'desc' })
        .populate('author')
        .exec(),
      Server.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function (results) {
      var servers = results[0];
      var serversCount = results[1];
      var user = results[2];

      return res.json({
        servers: servers.map(function (server) {
          return server.toJSONFor(user);
        }),
        serversCount: serversCount
      });
    });
  }).catch(next);
});

router.post('/', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    var server = new Server(req.body.server);
    server.author = user;
    title = server.title;

    var deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: title,
        labels: {
          app: title
        }
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: title
          }
        },
        template: {
          metadata: {
            labels: {
              app: title
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
                ]
              }
            ]
          }
        }
      }
    };


    server.createNamespacedDeployment(deployment);
    server.readNamespacedDeployment();

    var service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: title,
        labels: {
          app: title
        }
      },
      spec: {
        type: 'ClusterIP',
        selector: {
          app: title
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

    server.createNamespacedService(service);

    var path = {
      backend: {
        serviceName: title,
        servicePort: 80
      },
      path: '/(' + title + ')/?(.*)'
    }
    server.createNamespacedIngress(path);

    return server.save().then(function () {
      console.log(server.author);
      return res.json({ server: server.toJSONFor(user) });
    });
  }).catch(next);
});

// return a server
router.get('/:server', auth.optional, function (req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.server.populate('author').execPopulate()
  ]).then(function (results) {
    var user = results[0];

    return res.json({ server: req.server.toJSONFor(user) });
  }).catch(next);
});

// update server
router.put('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (req.server.author._id.toString() === req.payload.id.toString()) {
      if (typeof req.body.server.title !== 'undefined') {
        req.server.title = req.body.server.title;
      }

      if (typeof req.body.server.description !== 'undefined') {
        req.server.description = req.body.server.description;
      }

      if (typeof req.body.server.body !== 'undefined') {
        req.server.body = req.body.server.body;
      }

      req.server.save().then(function (server) {
        return res.json({ server: server.toJSONFor(user) });
      }).catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// delete server
router.delete('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (req.server.author._id.toString() === req.payload.id.toString()) {

      server.deleteNamespacedIngress();
      server.deleteNamespacedService();
      server.deleteNamespacedDeployment();

      return req.server.remove().then(function () {
        return res.sendStatus(204);
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

module.exports = router;
