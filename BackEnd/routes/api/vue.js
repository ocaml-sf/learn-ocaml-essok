var unzip = require('unzip');
var router = require('express').Router();
var auth = require('../auth');
var DIR = './uploads/';
var mongoose = require('mongoose');
var Vue = mongoose.model('Vue');


// Preload vue objects on routes with ':vue'
router.param('vue', function(req, res, next, slug) {
    Vue.findOne({ slug: slug})
      .populate('author')
      .then(function (vue) {
        if (!vue) { return res.sendStatus(404); }
  
        req.vue = vue;
  
        return next();
      }).catch(next);
  });
  router.get('/', auth.required, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;
  
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }
  
    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
  
    Promise.all([
      req.query.author ? User.findOne({username: req.query.author}) : null,
    ]).then(function(results){
      var author = results[0];
  
      if(author){
        query.author = author._id;
      }
  
      return Promise.all([
        Vue.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({createdAt: 'desc'})
          .populate('author')
          .exec(),
        Vue.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
      ]).then(function(results){
        var vues = results[0];
        var vuesCount = results[1];
        var user = results[2];
  
        return res.json({
          vues: vues.map(function(vue){
            return vue.toJSONFor(user);
          }),
          vuesCount: vuesCount
        });
      });
    }).catch(next);
  });
  
  router.post('/', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      var vue = new Vue(req.body.vue);
  
      vue.author = user;
  
      return vue.save().then(function(){
        console.log(vue.author);
        return res.json({vue: vue.toJSONFor(user)});
      });
    }).catch(next);
  });
  
  // return a vue
  router.get('/:vue', auth.optional, function(req, res, next) {
    Promise.all([
      req.payload ? User.findById(req.payload.id) : null,
      req.vue.populate('author').execPopulate()
    ]).then(function(results){
      var user = results[0];
  
      return res.json({vue: req.vue.toJSONFor(user)});
    }).catch(next);
  });
  
  // update vue
  router.put('/:vue', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if(req.vue.author._id.toString() === req.payload.id.toString()){
        if(typeof req.body.vue.title !== 'undefined'){
          req.vue.title = req.body.vue.title;
        }
  
        if(typeof req.body.vue.body !== 'undefined'){
          req.vue.body = req.body.vue.body;
        }
  
        req.vue.save().then(function(vue){
          return res.json({vue: vue.toJSONFor(user)});
        }).catch(next);
      } else {
        return res.sendStatus(403);
      }
    });
  });
  
  // delete vue
  router.delete('/:vue', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      if(req.vue.author._id.toString() === req.payload.id.toString()){
        return req.vue.remove().then(function(){
          return res.sendStatus(204);
        });
      } else {
        return res.sendStatus(403);
      }
    }).catch(next);
  });
  
  module.exports = router;
  