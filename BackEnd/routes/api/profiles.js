var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var auth = require('../auth');
const api_code = require('../../configs/api_code');

// Preload user profile on routes with ':username'
router.param('username', function (req, res, next, username) {
  User.findOne({ username: username }).then(function (user) {
    if (!user) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'User not found' } }); }

    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/:username', auth.required, function (req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
  ]).then(function (results) {
    var user = results[0];
    if (!user
      || (!user.isAdmin() && !user.authorized)
      || ((user.username !== req.profile.username) && (!user.isAdmin()))
    ) { return res.sendStatus(api_code.forbidden); }
    else return res.json({ profile: req.profile.toProfileJSONFor(user) });
  }).catch(next);

});

// code duplication to remove in the future
router.get('/user/:username', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user
      || (!user.isAdmin() && !user.authorized)
      || ((user.username !== req.profile.username) && (!user.isAdmin()))
    ) { return res.sendStatus(api_code.forbidden); }
    else return res.json({ user: req.profile.toAuthJSON() });
  }).catch(next);
});

module.exports = router;
