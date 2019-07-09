var router = require('express').Router();
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var User = mongoose.model('User');
var auth = require('../auth');
var events = require('events');

// Preload server objects on routes with ':server'
router.param('server', function (req, res, next, slug) {
  Server.findOne({ slug: slug })
    .populate('author')
    .then(function (server) {
      if (!server) { return res.sendStatus(404); }

      req.server = server;

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
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    Promise.all([

      req.query.author ? User.findOne({ username: req.query.author }) : null,
    ]).then(function (results) {
      var author = results[0];

      if (user.isAdmin()) {
        if (author) {
          query.author = author._id;
        }
      }
      else {
        query.author = req.payload.id;
        // we'll see
        //query.active = true;
      }


      return Promise.all([
        Server.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: 'desc' })
          .populate('author')
          .exec(),
        Server.countDocuments(query).exec(),
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
  }).catch(next);
});

router.post('/', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    var server = new Server(req.body.server);
    server.author = user;
    server.createkubelink();
    return server.save().then(function () {
      console.log(server.author);
      return res.json({ server: server.toJSONFor(user) });
    });
  }).catch(next);
});

// return a server
router.get('/:server', auth.required, function (req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.server.populate('author').execPopulate(),

  ]).then(function (results) {
    var user = results[0];
    var server = req.server.toJSONFor(user);
    if (!user) { return res.sendStatus(401); }
    if ((user.username !== server.author.username) && (!user.isAdmin())) { return res.sendStatus(401); }

    return res.json({ server });
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

//disable or enable a server
router.post('/disable/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

      var eventEmitter = new events.EventEmitter();

      eventEmitter.emit('kube_creation');

      var createHandler = function () {
        req.server.createkubelink();
        eventEmitter.emit('kube_disable');
      }
      var deleteHandler = function () {
        req.server.removekubelink(eventEmitter, req.server);
        eventEmitter.emit('kube_disable');
        console.log('done');

      }
      eventEmitter.on('kube_deletion', deleteHandler);
      eventEmitter.on('kube_creation', createHandler);

      eventEmitter.on('kube_disable', function () {
        req.server.active = !req.server.active;

        req.server.save().then(function () {
          return res.sendStatus(204);
        });
      });

      if (req.server.active) {
        eventEmitter.emit('kube_deletion');
      } else {
        eventEmitter.emit('kube_creation');
      }
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

// delete server
router.delete('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

      var eventEmitter = new events.EventEmitter();
      var deleteHandler = function () {
        req.server.removekubelink(eventEmitter, req.server);
        eventEmitter.emit('kube_unlinked');
      }
      eventEmitter.on('kube_deletion', deleteHandler);
      eventEmitter.on('kube_unlinked', function () {
        return req.server.remove().then(function () {
          return res.sendStatus(204);
        });
      });

      eventEmitter.emit('kube_deletion');

    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

module.exports = router;
