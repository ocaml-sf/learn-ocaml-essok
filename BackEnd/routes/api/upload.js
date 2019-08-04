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
    destPath = file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname);
    cb(null, destPath);
  }
});
let upload = multer({ storage: storage });

router.get('/', auth.required, function (req, res) {
  res.end('file catcher example');
});

router.post('/', auth.required, upload.single('file'), function (req, res, next) {
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
          var uploadHandler = function () {
            if (req.file.mimetype === 'application/zip') {
              // fs.createReadStream(dirPath + destPath).pipe(unzip.Extract({ path: dirPath }));
              eventEmitter.emit('fileTared');
            }
          }
          eventEmitter.on('file_uploading', uploadHandler);


          eventEmitter.on('fileTared', function () {
            var path = dirPath + destPath;

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

          });

          eventEmitter.on('fileUploaded', function () {
            server.processing = false;
            return res.send({
              success: true
            });
          });

          eventEmitter.on('fileFailedUploaded', function () {
            server.processing = false;
            return res.send({
              success: false
            });
          });

          if (req.file.mimetype === 'application/zip') {
            server.processing = true;
            console.log('file received');
            eventEmitter.emit('file_uploading');
          }

          else {
            console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
            return res.status(422).json({ errors: { file: "must be an .zip archive" } });
          }
        }
      }).catch(next);
  }).catch(next);
});

module.exports = router;
