var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');
const k8s = require('@kubernetes/client-node');

router.get('/user', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }

    return res.json({ user: user.toAuthJSON() });
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

router.post('/users', function (req, res, next) {
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.description = req.body.user.description;
  user.place = req.body.user.place;
  user.goal = req.body.user.goal;
  user.setPassword(req.body.user.password);

  // creer les namespaces ici
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  var namespace = {
    metadata: {
      name: 'test',
    },
  };

  k8sApi.createNamespace(namespace).then(
    (response) => {
      console.log('Created namespace');
      //console.log(response);
      k8sApi.readNamespace(namespace.metadata.name).then((response) => {
        //console.log(response);
      });
    },
    (err) => {
      console.log('Error!: ' + err);
    },
  );

  user.save().then(function () {
    return res.json({ user: user.toAuthJSON() });
  }).catch(next);
});

module.exports = router;
