/*eslint-disable*/
var router = require('express').Router();
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');
var auth = require('../auth');
const path = require('path');
var dirPath = './uploads/';
var destPath = '';
var User = mongoose.model('User');
var Server = mongoose.model('Server');
var upload_functions = require('../../lib/upload_functions');
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
          var dest_path = './uploads/' + server.author.username + '/';
          var source_path = dirPath + destPath;
          if (req.file.mimetype === 'application/zip' && req.file.originalname === 'exercises.zip') {
            console.log('file received');
            upload_functions.desarchived(dest_path, source_path).then((response) => {
              upload_functions.unlinkSync(source_path).then((response) => {
                upload_functions.checkFiles(dest_path + 'exercises/').then((files) => {
                  return res.json({
                    success: true,
                    name: files
                  });
                }, (err) => {
                  console.log('Error checkFiles !: ' + err);
                });
              }, (err) => {
                console.log('Error unlink !: ' + err);
              });
            },
              (err) => {
                console.log('Error desarchived !: ' + err);
              },
            );
          } else {
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
        var dest_path = './uploads/' + server.author.username + '/';

        if (upload_functions.parse_url(file_url) !== 'github.com') {
          return res.status(422).json({ errors: { errors: ': URL invalid' } });
        }

        upload_functions.download_from_url(file_url, DOWNLOAD_DIR).then((archive_path) => {
          upload_functions.desarchived(dest_path, archive_path).then((response) => {
            upload_functions.unlinkSync(archive_path).then((response) => {
              upload_functions.checkFiles(dest_path + 'master/').then((files) => {
                return res.json({
                  success: true,
                  name: files
                });
              }, (err) => {
                console.log('Error checkFiles !: ' + err);
              });
            }, (err) => {
              console.log('Error unlink !: ' + err);
            });
          },
            (err) => {
              console.log('Error desarchived !: ' + err);
            },
          );
        }, (err) => {
          console.log('Error download from url !: ' + err);
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

        console.log(req.body);
        console.log(req.body.list);
        console.log(req.body.list[0]);
        if (!req.body.list || req.body.list === undefined) {
          console.log("No name received");

          return res.send({ errors: { file: ": No name received" } });

        } else {
          var dir = './uploads/' + server.author.username + '/';
          var tabOfName = req.body.list;
          console.log(typeof (tabOfName));
          var eventEmitter = new events.EventEmitter();
          var uploadHandler = function () {

            var files = fs.readdirSync(dir + 'exercises/');
            files.forEach(element => {
              var found = undefined;
              var tmp = undefined;
              tabOfName.forEach(group => {
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

            fs.writeFile(dir + 'exercises/index.json', '{ "learnocaml_version": "1",\n  "groups":\n  {\n', function (err) {
              console.log(err);
            });


            tabOfName = tabOfName.filter(group => group.length >= 2);
            console.log(tabOfName);

            var name = 1;
            for (let i = 0; i < tabOfName.length; i++) {
              var group = tabOfName[i];
              for (let index = 0; index < group.length; index++) {

                if (index === 0) {
                  fs.appendFile(dir + 'exercises/index.json', '    "group-' + name + '":\n    { "title": "' + group[index] + '",\n      "exercises": [ \n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                  });
                } else if (index === group.length - 1) {
                  fs.appendFile(dir + 'exercises/index.json', '                     "' + group[index] + '" ] }', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                  });
                  if (i !== tabOfName.length - 1) {
                    fs.appendFile(dir + 'exercises/index.json', ',\n', function (err) {
                      if (err) throw err;
                      console.log('Updated!');
                    });
                  }
                  else {
                    fs.appendFile(dir + 'exercises/index.json', '\n', function (err) {
                      if (err) throw err;
                      console.log('Updated!');
                    });
                  }
                }
                else {
                  fs.appendFile(dir + 'exercises/index.json', '                     "' + group[index] + '",\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                  });
                }
              }

              name++;
            };
            fs.appendFile(dir + 'exercises/index.json', '} }', function (err) {
              if (err) throw err;
              console.log('Updated!');
            });

            eventEmitter.emit('indexcreated');
          });

          eventEmitter.on('indexcreated', function () {
            return res.status(422).json({ errors: { file: "index.json created" } });
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
