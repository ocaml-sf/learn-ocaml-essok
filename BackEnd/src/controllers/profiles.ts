import { Router } from 'express';
var mongoose = require('mongoose');
var User = mongoose.model('User');

import auth from './auth';

import api_code from '../configs/api_code';

const router = Router();

// Preload user profile on routes with ':username'
router.param('username', function (req : any, res, next, username) {
  User.findOne({ username: username }).then(function (user : any) {
    if (!user) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'User not found' } }); }

    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/:username', auth.required, function (req : any, res, next) {
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
router.get('/user/:username', auth.required, function (req : any, res, next) {
  User.findById(req.payload.id).then(function (user : any) {
    if (!user
      || (!user.isAdmin() && !user.authorized)
      || ((user.username !== req.profile.username) && (!user.isAdmin()))
    ) { return res.sendStatus(api_code.forbidden); }
    else return res.json({ user: req.profile.toAuthJSON() });
  }).catch(next);
});

module.exports = router;
