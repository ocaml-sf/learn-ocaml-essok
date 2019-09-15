var router = require('express').Router();
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var User = mongoose.model('User');
var auth = require('../auth');
var events = require('events');
const server_functions = require('../../lib/server_functions');

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

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    if ((user.username !== req.query.author) && !user.isAdmin()) { return res.sendStatus(401); }
    var author = req.query.author;
    user.findAnUser(author).then(function (results) {

      author = results[0];
      console.log(author);
      user.findAllServersOfAnUser(req.query, author, req.payload).then(function (results) {
        var servers = results[0];
        var serversCount = results[1];

        return res.json({
          servers: servers.map(function (server) {
            if (!server.processing)
              return server.toJSONFor(author);
            else serversCount -= 1;
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
    if (!user.active) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }
    var server = new Server(req.body.server);
    server.author = user;
    return server.save().then(function () {
      server_functions.createSwiftContainer(server.slug).then((response) => {
        console.log('swift created');
        return res.json({ server: server.toJSONFor(user) });
      }, (err) => {
        return res.status(422).send({ errors: { err } });
      });
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
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    if ((user.username !== server.author.username) && (!user.isAdmin())) { return res.sendStatus(401); }
    if (!server.processing) {
      return res.json({ server });
    }
    else {
      return res.sendStatus(401);
    }
  }).catch(next);
});

// update server
router.put('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user.active) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    if (req.server.author._id.toString() === req.payload.id.toString()) {
      if (req.server.active || req.server.processing) { return res.sendStatus(401); }

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
      if (!user.active) { return res.sendStatus(401); }
      if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }
      if (req.server.processing) { return res.sendStatus(401); }

      var slug = req.server.slug;
      var username = req.server.author.username;
      var namespace = 'default';

      if (req.server.active) {
        req.server.processing = true;
        console.log('shut_off');
        var volume = req.server.volume;
        console.log('volume : ' + volume);
        server_functions.shut_off(slug, namespace, volume).then((response) => {
          req.server.active = false;
          req.server.processing = false;
          req.server.save().then(function () {
            return res.sendStatus(204);
          });
        }, (err) => {
          return res.status(422).send({ errors: { err } });
        });
      } else {
        req.server.processing = true;
        console.log('shut_on');
        server_functions.shut_on(slug, username, namespace).then((response) => {
          req.server.processing = false;
          req.server.volume = response;
          req.server.active = true;
          req.server.save().then(function () {
            return res.sendStatus(204);
          });
        }, (err) => {
          return res.status(422).send({ errors: { err } });
        });
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
    if (!user.active) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }
    if (req.server.processing) { return res.sendStatus(401); }

    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

      var slug = req.server.slug;
      var namespace = 'default';
      console.log('asking for a deletion');
      console.log('slug : ' + slug);
      console.log('namespace : ' + namespace);
      server_functions.delete(slug, namespace).then((response) => {
        return req.server.remove().then(function () {
          return res.sendStatus(204);
        });
      }, (err) => {
        return res.status(422).send({ errors: { err } });
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

module.exports = router;
