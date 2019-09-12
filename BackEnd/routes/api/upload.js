/*eslint-disable*/
var router = require('express').Router();
var mongoose = require('mongoose');
var multer = require('multer');
var unzip = require('unzip');
var fs = require('fs');
var url = require('url');
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
const http = require('http');

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

              fs.createReadStream(dirPath + destPath).pipe(unzip.Extract({ path: dir })).end(function (err) {
                console.log('extracted');
                eventEmitter.emit('desarchived');
              });
            }
          }


          eventEmitter.on('desarchived', function () {
            // check the name of the files in the repository and send them to the Frontend

            var files = fs.readdirSync(dir + 'exercises/');
            console.log(files);

            files.forEach(element => {
              if (element === 'index.json') {
                fs.unlinkSync(dir + 'exercises/index.json');

              }
            });
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
            return res.status(422).json({ errors: { file: "must be exercises.zip found " + req.file.mimetype } });
          }
        }
      }).catch(next);
  }).catch(next);
});

router.post('/url', auth.required, function (req, res, next) {

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }
    Server.findOne({ slug: req.body.server })
      .populate('author')
      .then(function (server) {
        if (!server) { return res.sendStatus(404); }
        if ((server.author !== user) && (!user.isAdmin())) { return res.sendStatus(401); }
        if (server.processing) { return res.sendStatus(401); }

        console.log(req.body);
        var file_url = req.body.url.url + '/archive/master.zip';
        var DOWNLOAD_DIR = './downloads/';

        if (url.parse(file_url).host !== 'github.com') {
          return res.status(422).json({ errors: { errors: ': URL invalid' } });
        }
        // Function for downloading file using HTTP.get
        var options = {
          host: url.parse(file_url).host,
          port: 80,
          path: url.parse(file_url).pathname
        };
        console.log('host: ' + url.parse(file_url).host);
        console.log('path: ' + url.parse(file_url).pathname);

        var file_name = url.parse(file_url).pathname.split('/').pop();
        var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);

        http.get(options, function (res) {
          res.on('data', function (data) {
            file.write(data);
          }).on('end', function () {
            file.end();
            console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
          }).on('error', function (err) {
            console.log(err);
          })
        });

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

        if (!req.list || req.list === undefined) {
          console.log("No name received");

          return res.send({ errors: { file: ": No name received" + req.file.mimetype } });

        } else {
          var dir = './uploads/' + server.author.username + '/';

          var eventEmitter = new events.EventEmitter();
          var uploadHandler = function () {

            var files = fs.readdirSync(dir + 'exercises/');
            files.forEach(element => {
              var found = undefined;
              var tmp = undefined;
              req.body.files.forEach(group => {

                if ((tmp = group.find(function (name) {
                  return name === element;
                })) !== undefined) {
                  found = tmp;
                }
              });
              if (found === undefined) {
                fs.unlinkSync(dir + 'exercises/' + element);
              }
            });

            eventEmitter.emit('filedeleted');
          }

          eventEmitter.on('filedeleted', function () {

            fs.writeFile(dir + 'exercises/index.json', '{ "learnocaml_version": "1",\n  "groups":\n', function (err) {
              console.log(err);
            });

            req.body.files.forEach(group => {
              group.forEach(element => {
                fs.appendFile(dir + 'exercises/index.json', ' This is my text.', function (err) {
                  if (err) throw err;
                  console.log('Updated!');
                });
              });
            });


            eventEmitter.emit('indexcreated');
          });
          eventEmitter.on('indexcreated', function () {
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

          });

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
