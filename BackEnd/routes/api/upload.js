/*eslint-disable*/
var router = require('express').Router();
var mongoose = require('mongoose');
var multer = require('multer');
var unzip = require('unzip');
var fs = require('fs');
var auth = require('../auth');
const path = require('path');
var dirPath = './uploads/';
var destPath = '';
var User = mongoose.model('User');
var Server = mongoose.model('Server');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
var events = require('events');
var swiftClient = require('../../Client/swiftClient');

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    destPath = path.extname(file.originalname);
    cb(null, destPath);
  }
});
let upload = multer({ storage: storage });

router.get('/', auth.required, function (req, res) {
  res.end('file catcher example');
});

router.post('/check', auth.required, upload.single('file'), function (req, res, next) {
  console.log(req.body.server);

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    Server.findOne({ slug: req.body.server })
      .populate('author')
      .then(function (server) {
        if (!server) { return res.sendStatus(404); }
        if ((server.author !== user) && (!user.isAdmin())) { return res.sendStatus(401); }
        if (server.processing) { return res.sendStatus(401); }

        if (!req.file) {
          console.log("No file received");
          return res.send({
            success: false
          });

        } else {

          var eventEmitter = new events.EventEmitter();
          var dir = './uploads/' + server.author.username + '/';

          var uploadHandler = function () {
            if (req.file.mimetype === 'application/zip') {
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
              }

              fs.createReadStream(dirPath + destPath).pipe(unzip.Extract({ path: dir }));
              console.log('extracted');
              eventEmitter.emit('desarchived');
            }

          }


          eventEmitter.on('desarchived', function () {
            // check the name of the files in the repository and send them to the Frontend

            var files = fs.readdirSync(dir + 'exercises/');
            console.log(files);
            
            server.processing = false;
            fs.unlinkSync(dirPath + destPath);

            return res.json({
              success: true,
              name: files
            });
          });

          eventEmitter.on('file_uploading', uploadHandler);

          if (req.file.mimetype === 'application/zip' && req.file.originalname === 'exercises.zip') {
            console.log('file received');
            eventEmitter.emit('file_uploading');
          }

          else {
            console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
            return res.status(422).json({ errors: { file: "must be exercices.zip" } });
          }
        }
      }).catch(next);
  }).catch(next);
});


router.post('/send', auth.required, function (req, res, next) {
  console.log(req.body.server);

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    Server.findOne({ slug: req.body.server })
      .populate('author')
      .then(function (server) {
        if (!server) { return res.sendStatus(404); }
        if ((server.author !== user) && (!user.isAdmin())) { return res.sendStatus(401); }
        if (server.processing) { return res.sendStatus(401); }

        if (!req.name || req.name === undefined) {
          console.log("No name received");
          return res.send({
            success: false
          });

        } else {

          var eventEmitter = new events.EventEmitter();

          var uploadHandler = function () {
            var path = dirPath + destPath; //modify 

            var readStream = fs.createReadStream(path);
            var writeStream = swiftClient.upload({
              container: server.slug,
              remote: destPath
            });

            writeStream.on('error', function (err) {
              // handle your error case
              console.log(err);
              eventEmitter.emit('fileFailedUploaded');
            });

            writeStream.on('success', function (file) {
              // success, file will be a File model
              console.log('file uploaded on swift :' + JSON.stringify(file));
              eventEmitter.emit('fileUploaded');
            });

            readStream.pipe(writeStream);

          }
          eventEmitter.on('file_uploading', uploadHandler);


          eventEmitter.on('fileUploaded', function () {
            // server.processing = false;
            return res.send({
              success: true
            });
          });

          eventEmitter.on('fileFailedUploaded', function () {
            // server.processing = false;
            return res.send({
              success: false
            });
          });


          // server.processing = true;
          // console.log('file received');
          eventEmitter.emit('file_uploading');

        }
      }).catch(next);
  }).catch(next);
});

module.exports = router;
