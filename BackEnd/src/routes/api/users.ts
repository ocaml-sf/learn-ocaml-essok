import { Router } from 'express';
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');

import auth from '../auth';

import * as server_functions from '../../lib/server_functions';
import * as global_functions from '../../lib/global_functions';

import api_code from '../../configs/api_code';

const router = Router();

router.get('/user', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }

    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

router.get('/users', auth.required, function (req : any, res, next) {
  var query : any = {};
  var limit = 20;
  var offset = 0;
  console.log(' req.query.limit ' + req.query.limit);
  console.log(' req.query.offset ' + req.query.offset);
  console.log(' req.query.active ' + req.query.active);
  console.log(' req.query.authorized ' + req.query.authorized);

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  if (typeof req.query.active !== 'undefined') {
    query.active = req.query.active;
  }

  if (typeof req.query.authorized !== 'undefined') {
    query.authorized = req.query.authorized;
  }

  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (user.isAdmin()) {

      return user.findAllUsers(query, limit, offset).then(function (results : any) {
        var users = results[0];
        var usersCount = results[1];

        return res.json({
          users: users,
          usersCount: usersCount
        });
      });
    } else {
      return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
    }
  }).catch(next);
});

router.put('/user', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (!user.active) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }

    var userToMdify : any = 'undefined';

    if (user.isAdmin() && (req.body.userBase.username !== 'undefined')) {
      User.find({ username: req.body.userBase.username }).then(function (response : any) {
        userToMdify = response[0];
      });
    }
    else {
      userToMdify = user;
    }

    var userInChange = setInterval(function () {
      if (userToMdify !== 'undefined') {
        // only update fields that were actually passed...
        // if (typeof req.body.user.username !== 'undefined') { // may be useless
        //   userToMdify.username = req.body.user.username;
        // }
        if ((typeof req.body.user.email !== 'undefined')) {
          userToMdify.email = req.body.user.email;
        }
        if (typeof req.body.user.description !== 'undefined') {
          userToMdify.description = req.body.user.description;
        }
        if (typeof req.body.user.place !== 'undefined') {
          userToMdify.place = req.body.user.place;
        }
        if (typeof req.body.user.goal !== 'undefined') {
          userToMdify.goal = req.body.user.goal;
        }
        if (typeof req.body.user.image !== 'undefined') {
          userToMdify.image = req.body.user.image;
        }
        clearInterval(userInChange);
        return userToMdify.save().then(function () {
          return res.json({ user: userToMdify.toAuthJSON() });
        });
      }
    }, 300);
  }).catch(next);
});

router.post('/users/login', function (req : any, res, next) {
  if (!req.body.user.email) {
    return res.status(api_code.error).json({ errors: { email: "can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
  }

  passport.authenticate('local', { session: false }, function (err : any, user : any, info : any) {
    if (err) { return next(err); }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(api_code.error).json(info);
    }
  })(req, res, next);
});

router.post('/reset-password', auth.required, function (req : any, res, next) {

  if (!req.body.reset.new_password) {
    return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
  }

  if (!req.body.reset.new_password_verification) {
    return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
  }

  if (req.body.reset.new_password !== req.body.reset.new_password_verification) {
    return res.status(api_code.error).json({ errors: { password: "verification mismatch" } });
  }

  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }

    if (!user.active) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }

    if (!req.body.user.email) {
      return res.status(api_code.error).json({ errors: { email: "can't be blank" } });
    }

    if (req.body.user.email !== user.email) {
      return res.status(api_code.error).json({ errors: { email: "does not correspond" } });
    }

    if (!req.body.user.password) {
      return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(api_code.error).json({ errors: { password: "does not correspond" } });
    }

    user.setPassword(req.body.reset.new_password);

    return user.save().then(function () {
      return res.json({ user: user.toAuthJSON() });
    });
  }).catch(next);
});

//disable or enable an user
router.post('/users/disable', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (!user.authorized && !user.isAdmin()) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
    if (user.processing) { return res.sendStatus(api_code.forbidden); }

    if (!req.body.user.email) {
      return res.status(api_code.error).json({ errors: { email: "can't be blank" } });
    }

    if (req.body.user.email !== user.email) {
      return res.status(api_code.error).json({ errors: { email: "does not correspond" } });
    }

    if (!req.body.user.password) {
      return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(api_code.error).json({ errors: { password: "does not correspond" } });
    }

    if (!req.body.disable.password_verification) {
      return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
    }

    if (req.body.user.password !== req.body.disable.password_verification) {
      return res.status(api_code.error).json({ errors: { password: "verification mismatch" } });
    }
    if (!req.body.disable.username_verification) {
      return res.status(api_code.error).json({ errors: { username: "can't be blank" } });
    }

    if (!user.isAdmin()) {
      if (req.body.disable.username_verification !== user.username) {
        return res.status(api_code.error).json({ errors: { username: "verification mismatch" } });
      }
    }

    var authors = req.body.disable.username_verification;

    user.findAnUser(authors).then(function (results : any) {

      const author : any = results[0];

      user.findAllServersOfAnUser(req.query, author, req.payload).then(function (results : any) {
        var servers = results[0];
        if (servers.length == 0) {
          author.active = !author.active;
          console.log('user status up to date');
          author.save();
          if (!user.isAdmin()) {
            return res.json({ user: author.toAuthJSON() });
          }
          else {
            return res.json({ user: user.toAuthJSON() });
          }
        }
        var itemsProcessed = 0;

        servers.forEach((server : any, index : any, array : any) => {
          global_functions.asyncFunction(server, () => {

            if (server.active && user.active) {
              console.log('preparing shut_off');
              var namespace = 'default';

              server_functions.removekubelink(server.slug, namespace).then((response : any) => {
                server.active = false;
                server.save();

              }, (err : any) => {
                // return res.status(api_code.error).send({ errors: { err } });
                console.log(err);
              });
            }

            itemsProcessed++;
            if (itemsProcessed === array.length) {

              // add a waiting list (interval) for all servers

              console.log('author = ' + author);
              console.log('all servers are done');
              author.active = !author.active;
              console.log('user status up to date');
              author.save();
              if (!user.isAdmin()) {
                return res.json({ user: author.toAuthJSON() });
              }
              else {
                return res.json({ user: user.toAuthJSON() });
              }
            }
          });
        });
      });
    }).catch(next);
  }).catch(next);
});

//delete an user
router.post('/users/delete', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden); }
    if (!user.authorized && !user.isAdmin()) { return res.sendStatus(api_code.forbidden); }
    if (user.processing) { return res.sendStatus(api_code.forbidden); }

    if (!req.body.user.email) {
      return res.status(api_code.error).json({ errors: { email: "can't be blank" } });
    }

    if (req.body.user.email !== user.email) {
      return res.status(api_code.error).json({ errors: { email: "does not correspond" } });
    }

    if (!req.body.user.password) {
      return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(api_code.error).json({ errors: { password: "does not correspond" } });
    }

    if (!req.body.disable.password_verification) {
      return res.status(api_code.error).json({ errors: { password: "can't be blank" } });
    }

    if (req.body.user.password !== req.body.disable.password_verification) {
      return res.status(api_code.error).json({ errors: { password: "verification mismatch" } });
    }
    if (!req.body.disable.username_verification) {
      return res.status(api_code.error).json({ errors: { username: "can't be blank" } });
    }
    if (!user.isAdmin()) {
      if (req.body.disable.username_verification !== user.username) {
        return res.status(api_code.error).json({ errors: { username: "verification mismatch" } });
      }
    }

    var authors = req.body.disable.username_verification;
    console.log('author = ' + authors);
    user.findAnUser(authors).then(function (results : any) {

      const author : any = results[0];
      console.log('author = ' + author);
      user.findAllServersOfAnUser(req.query, author, req.payload).then(function (results : any) {
        var servers = results[0];
        if (servers.length == 0) {
          author.remove();
          return res.sendStatus(api_code.ok);
        }
        console.log('author = ' + author);
        var namespace = 'default';
        var itemsProcessed = 0;
        var itemToDelete = servers.length;
        servers.forEach((server : any, index : any, array : any) => {
          global_functions.asyncFunction(server, () => {
            console.log('asking for a deletion');
            console.log('slug : ' + server.slug);
            console.log('namespace : ' + namespace);
            server_functions.deleteAll(server.slug, namespace, './uploads/' + user.username + '/' + server.slug + '/').then((response : any) => {
              itemToDelete--;
              server.remove();
            });
          });
          itemsProcessed++;
          if (itemsProcessed === array.length) {
            var userInChange = setInterval(function () {
              if (itemToDelete === 0) {
                clearInterval(userInChange);
                console.log('all servers are done');
                author.remove();
                return res.sendStatus(api_code.ok);
              }
              console.log('itemToDelete : ' + itemToDelete);
            }, 5000);
            // add a waiting list (interval) for all servers


          }
        });
      });
    }).catch(next);
  }).catch(next);
});

router.post('/users', function (req : any, res, next) {
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.description = req.body.user.description;
  user.place = req.body.user.place;
  user.goal = req.body.user.goal;
  user.setPassword(req.body.user.password);

  // var namespace = user_functions.createObjectNamespace('default');

  // user_functions.createNamespace(namespace).then((response) => {
  //   user_functions.readNamespace(namespace.metadata.name);

  // });


  user.save().then(function () {
    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

router.post('/user/activate', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden); }
    if (!user.isAdmin()) { return res.sendStatus(api_code.forbidden); }
    user.findAnUser(req.body.user.username).then(function (userToActivate : any) {
      userToActivate[0].authorized = true;
      userToActivate[0].active = true;
      userToActivate[0].save().then(function () {
        return res.json({ user: userToActivate[0].toAuthJSON() });
      }).catch(next);
    }).catch(next);
  }).catch(next);
});

router.post('/user/authorize', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.forbidden); }
    if (!user.isAdmin()) { return res.sendStatus(api_code.forbidden); }
    user.findAnUser(req.body.user.username).then(function (userToActivate : any) {
      userToActivate[0].authorized = true;
      userToActivate[0].processing = false;
      userToActivate[0].save().then(function () {
        return res.json({ user: userToActivate[0].toAuthJSON() });
      }).catch(next);
    }).catch(next);
  }).catch(next);
});

module.exports = router;
