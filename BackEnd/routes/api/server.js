var router = require('express').Router();
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var User = mongoose.model('User');
var auth = require('../auth');
var events = require('events');
const server_functions = require('../../lib/server_functions');
const log_functions = require('../../lib/log_functions');

// Preload server objects on routes with ':server'
router.param('server', function (req, res, next, slug) {
  Server.findOne({ slug: slug })
    .populate('author')
    .then(function (server) {
      if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Server ' + slug + ' not found' } }); }

      req.server = server;

      return next();
    }).catch(next);
});

router.get('/', auth.required, function (req, res, next) {

  User.findById(req.payload.id).then(function (user) {
    if (!user) {
      log_functions.create('error', 'get /server/',
        'user unknown, value ' + user, user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'get /server/',
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }

    if ((user.username !== req.query.author) && !user.isAdmin()) {
      log_functions.create('error', 'get /server/',
        'user unauthorized to access the server, his is trying to access a not owned server', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    var author = req.query.author;
    user.findAnUser(author).then(function (results) {

      author = results[0];
      console.log(author);
      user.findAllServersOfAnUser(req.query, author, req.payload).then(function (results) {
        var servers = results[0];
        var serversCount = results[1];
        log_functions.create('general', 'get /server/', 'ok', user, req.server)
        return res.json({
          servers: servers.map(function (server) {
            return server.toJSONFor(author);
          }),
          serversCount: serversCount
        });
      });
    }).catch(next);
  }).catch(next);

});

router.post('/', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) {
      log_functions.create('error', 'post /server/',
        'user unknown, value ' + user, user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.active) {
      log_functions.create('error', 'post /server/',
        'user unauthorized to access the server, his account is disabled', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'post /server/',
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    var server = new Server(req.body.server);
    server.author = user;
    log_functions.create('bin', 'post /server/', 'user has created a server', user, server)
    return server.save().then(function () {
      server_functions.createSwiftContainer(server.slug).then((response) => {
        log_functions.create('general', 'post /server/', 'user has created a swift container', user, server)
        console.log('swift created');
        return res.json({ server: server.toJSONFor(user) });
      }, (err) => {
        log_functions.create('error', 'post /server/',
          'user failed to create a swift container for the server', user, server);
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
    if (!user) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        'user unknown, value ' + user, user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }

    if ((user.username !== server.author.username) && (!user.isAdmin())) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        'user unauthorized to access the server, he is trying to access a not owned server', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    log_functions.create('general', 'get /server/:' + req.server.slug, 'ok', user, req.server);
    return res.json({ server });

  }).catch(next);
});

// update server
router.put('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user.active) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is disabled', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (user.processing) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is processing', user, req.server);
      return res.sendStatus(401);
    }
    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

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
        log_functions.create('bin', 'put /server/:' + req.server.slug, 'server information updated', user, req.server);
        return res.json({ server: server.toJSONFor(user) });
      }).catch(next);
    } else {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        'user unauthorized to access the server, his is trying to access a not owned server', user, req.server);
      return res.sendStatus(403).json({ errors: { errors: 'Unauthorized' } });
    }
  });
});

//disable or enable a server
router.post('/disable/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {
      if (!user.active) {
        log_functions.create('error', 'post /server/disable/:' + req.server.slug,
          'user unauthorized to access the server, his account is disabled', user, req.server);
        return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
      }
      if (!user.isAdmin() && !user.authorized) {
        log_functions.create('error', 'post /server/disable/:' + req.server.slug,
          'user unauthorized to access the server, his account is not already activated', user, req.server);
        return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
      }
      if (user.processing) {
        log_functions.create('error', 'post /server/disable/:' + req.server.slug,
          'user unauthorized to access the server, his account is processing', user, req.server); return res.sendStatus(401);
      }

      var slug = req.server.slug;
      var username = req.server.author.username;
      var namespace = 'default';

      if (req.server.active) {
        console.log('shut_off');
        var volume = req.server.volume;
        console.log('volume : ' + volume);
        user.startProcessing().then(() => {
          log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user start processing', user);
          console.log('user.processing : ' + user.processing);
          server_functions.shut_off(slug, namespace, volume).then((response) => {
            user.endProcessing().then(() => {
              log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user end processing', user);
              console.log('user.processing : ' + user.processing);
              req.server.active = false;
              req.server.save().then(function () {
                log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'server shut off', user, req.server);
                return res.sendStatus(204);
              });
            });
          }, (err) => {
            user.endProcessing().then(() => {
              log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user end processing', user);
              return res.status(422).send({ errors: { err } });
            });
          });
        });
      } else {
        console.log('shut_on');
        user.startProcessing().then(() => {
          log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user start processing', user);
          console.log('user.processing : ' + user.processing);
          server_functions.shut_on(slug, username, namespace).then((response) => {
            user.endProcessing().then(() => {
              log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user end processing', user);
              console.log('user.processing : ' + user.processing);
              req.server.volume = response;
              req.server.active = true;
              req.server.save().then(function () {
                log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'server shut on', user, req.server);
                return res.sendStatus(204);
              });
            });
          }, (err) => {
            user.endProcessing().then(() => {
              log_functions.create('bin', 'post /server/disable/:' + req.server.slug, 'user end processing', user);
              return res.status(422).send({ errors: { err } });
            });
          });
        });
      }
    } else {
      log_functions.create('error', 'get /server/disable/:' + req.server.slug,
        'user unauthorized to access the server, his is trying to access a not owned server', user, req.server);
      return res.sendStatus(403);
    }
  }).catch(next);
});

// delete server
router.delete('/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        'user unknown, value ' + user, user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.active) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is disabled', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (user.processing) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is processing', user, req.server); return res.sendStatus(401);
    }

    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

      var slug = req.server.slug;
      var namespace = 'default';
      console.log('asking for a deletion');
      console.log('slug : ' + slug);
      console.log('namespace : ' + namespace);
      log_functions.create('bin', 'delete /server/:' + req.server.slug, 'user asking for a deletion', user, req.server);

      user.startProcessing().then(() => {
        log_functions.create('bin', 'delete /server/:' + req.server.slug, 'user start processing', user);
        server_functions.delete(slug, namespace).then((response) => {
          user.endProcessing().then(() => {
            log_functions.create('bin', 'delete /server/:' + req.server.slug, 'user end processing', user);
            log_functions.create('bin', 'delete /server/:' + req.server.slug, 'server deleted', user, req.server).then(() => {
              return req.server.remove().then(function () {
                return res.sendStatus(204);
              });
            })
          });
        }, (err) => {
          user.endProcessing().then(() => {
            log_functions.create('bin', 'delete /server/:' + req.server.slug, 'user end processing', user);
            return res.status(422).send({ errors: { err } });
          });
        });
      });
    } else {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        'user unauthorized to access the server, his is trying to access a not owned server', user, req.server);
      return res.sendStatus(403);
    }
  }).catch(next);
});

router.post('/token/:server', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        'user unknown, value ' + user, user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.active) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is disabled', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        'user unauthorized to access the server, his account is not already activated', user, req.server);
      return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
    }

    if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

      if (req.server.token !== undefined) {
        console.log(req.server.token);
        return res.status(422).send({ errors: 'teacher token already retrieve' });
      }
      else {
        user.startProcessing().then(async () => {
	    var slug = req.server.slug;
	    var namespace = 'default';
	    req.server.token = await server_functions.catchTeacherToken(slug, namespace);
	    if(req.server.token !== undefined)
		log_functions.create('bin', 'post /server/token:' + req.server.slug, 'user retrieved his token', user, req.server)
            return req.server.save().then(function () {
            user.endProcessing().then(() => {
              return res.json({ server: req.server.toJSONFor(user) });
            }, (err) => {
              user.endProcessing().then(() => {
                log_functions.create('error', 'post /server/',
                  'user failed to retrieve his token teacher for the server:' + req.server.slug, user, req.server);
                return res.status(422).send({ errors: { err } });
              });
            });
          });
        });
      }
    } else {
      log_functions.create('error', 'get /server/disable/:' + req.server.slug,
        'user unauthorized to access the server, his is trying to access a not owned server', user, req.server);
      return res.sendStatus(403);
    }
  }).catch(next);
});

module.exports = router;
