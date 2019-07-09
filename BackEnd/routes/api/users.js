var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');

router.get('/user', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

router.get('/users', auth.required, function (req, res, next) {
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
    if (user.isAdmin()) {

      return Promise.all([
        User.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: 'desc' })
          .exec(),
        User.countDocuments(query).exec(),
      ]).then(function (results) {
        var users = results[0];
        var usersCount = results[1];

        return res.json({
          users: users,
          usersCount: usersCount
        });
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

router.put('/user', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    // only update fields that were actually passed...
    if (typeof req.body.user.username !== 'undefined') {
      user.username = req.body.user.username;
    }
    if (typeof req.body.user.email !== 'undefined') {
      user.email = req.body.user.email;
    }
    if (typeof req.body.user.description !== 'undefined') {
      user.description = req.body.user.description;
    }
    if (typeof req.body.user.place !== 'undefined') {
      user.place = req.body.user.place;
    }
    if (typeof req.body.user.goal !== 'undefined') {
      user.goal = req.body.user.goal;
    }
    if (typeof req.body.user.image !== 'undefined') {
      user.image = req.body.user.image;
    }
    if (typeof req.body.user.password !== 'undefined') {
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function () {
      return res.json({ user: user.toAuthJSON() });
    });
  }).catch(next);
});

router.post('/users/login', function (req, res, next) {
  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: "can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  passport.authenticate('local', { session: false }, function (err, user, info) {
    if (err) { return next(err); }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post('/reset-password', auth.required, function (req, res, next) {

  if (!req.body.reset.new_password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  if (!req.body.reset.new_password_verification) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  if (req.body.reset.new_password !== req.body.reset.new_password_verification) {
    return res.status(422).json({ errors: { password: "verification mismatch" } });
  }

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    if (!req.body.user.email) {
      return res.status(422).json({ errors: { email: "can't be blank" } });
    }

    if (req.body.user.email !== user.email) {
      return res.status(422).json({ errors: { email: "does not correspond" } });
    }

    if (!req.body.user.password) {
      return res.status(422).json({ errors: { password: "can't be blank" } });
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(422).json({ errors: { password: "does not correspond" } });
    }

    user.setPassword(req.body.reset.new_password);

    return user.save().then(function () {
      return res.json({ user: user.toAuthJSON() });
    });
  }).catch(next);
});


//disable or enable an user
/**
 * Factorization of the code line 21 in server.js to use it here
 * 
 * 1/ Query for the user
 * 2/ Query for the server(s) (code line 21 )
 * 3/ Disable all the servers (function already done)
 * 4/ Disable the user (easy)
 * 
 */
router.post('/users/disable/', auth.required, function (req, res, next) {
});

router.post('/users', function (req, res, next) {
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.description = req.body.user.description;
  user.place = req.body.user.place;
  user.goal = req.body.user.goal;
  user.setPassword(req.body.user.password);

  var namespace = {
    metadata: {
      name: 'test',
    },
  };

  user.createNamespace(namespace);
  user.readNamespace(namespace.metadata.name);


  user.save().then(function () {
    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

module.exports = router;
