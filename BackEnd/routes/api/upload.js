/*eslint-disable*/
const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../auth');
const path = require('path');
var dirPath = './uploads/';
var destPath = '';
var User = mongoose.model('User');
var Server = mongoose.model('Server');
const upload_functions = require('../../lib/upload_functions');
const upload_errors = require('../../lib/errors');
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
            upload_functions.removeDir(dest_path).then((response) => {
              upload_functions.createDir(dest_path).then((response) => {
                upload_functions.desarchived(dest_path, source_path).then((response) => {
                  upload_functions.unlinkSync(source_path).then((response) => {
                    upload_functions.checkFiles(dest_path + 'exercises/').then((files) => {
                      return res.json({
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
              },
                (err) => {
                  console.log('Error createDir !: ' + err);
                  return res.status(422).json({ errors: { errors: err } });
                });
            },
              (err) => {
                console.log('Error removeDir !: ' + err);
                return res.status(422).json({ errors: { errors: err } });
              });
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
        var repo = req.body.url.url.split('/');
        if ((repo[repo.length - 1] === "") || (repo[repo.length - 1] === undefined)) {
          repo = repo[repo.length - 2];
        } else {
          repo = repo[repo.length - 1];
        }
        var DOWNLOAD_DIR = './downloads/';
        var dest_path = './uploads/' + server.author.username + '/';

        if (upload_functions.parse_url(file_url) !== 'github.com') {
          return res.status(422).json({ errors: { errors: ': URL invalid' } });
        }

        upload_functions.download_from_url(file_url, DOWNLOAD_DIR).then((archive_path) => {
          upload_functions.removeDir(dest_path).then((response) => {
            upload_functions.createDir(dest_path).then((response) => {
              upload_functions.desarchived(dest_path, archive_path).then((response) => {
                upload_functions.renameDir(dest_path + repo + '-master/', dest_path + 'exercises/').then((response) => {
                  upload_functions.unlinkSync(archive_path).then((response) => {
                    upload_functions.checkFiles(dest_path + 'exercises/').then((files) => {
                      console.log(files);
                      return res.json({
                        name: files
                      });
                    }, (err) => {
                      console.log('Error checkFiles !: ' + err);
                      return res.status(422).json({ errors: { errors: err } });
                    });
                  }, (err) => {
                    console.log('Error unlink !: ' + err);
                    return res.status(422).json({ errors: { errors: err } });
                  });
                }, (err) => {
                  console.log('Error renameDir !: ' + err);
                  return res.status(422).json({ errors: { errors: err } });
                });
              },
                (err) => {
                  console.log('Error desarchived !: ' + err);
                  return res.status(422).json({ errors: { errors: err } });
                });
            },
              (err) => {
                console.log('Error createDir !: ' + err);
                return res.status(422).json({ errors: { errors: err } });
              });
          },
            (err) => {
              console.log('Error removeDir !: ' + err);
              return res.status(422).json({ errors: { errors: err } });
            });
        },
          (err) => {
            console.log('Error download from url !: ' + err);
            var message = upload_errors.wget_error(err.code) + err.message;
            return res.status(422).send({ errors: { message } });
          });
      }).catch(next);
  }).catch(next);
});


router.post('/send', auth.required, function (req, res, next) {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401); }
    if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401); }

    Server.findOne({ slug: req.body.server })
      .populate('author')
      .then(function (server) {
        if (!server) { return res.sendStatus(404); }
        if ((server.author !== user) && (!user.isAdmin())) { return res.sendStatus(401); }
        if (server.processing) { return res.sendStatus(401); }
        if (!req.body.list || req.body.list === undefined) {
          return res.status(422).send({ errors: { file: ": No name received" } });
        } else {
          if (upload_errors.group_duplicate(req.body.list)) {
            return res.status(422).send({ errors: { file: ": Error in group names, duplicate name" } });
          }
          var dir = './uploads/' + server.author.username + '/';
          var tabOfName = req.body.list;

          upload_functions.checkFiles(dir + 'exercises/').then((files) => {
            upload_functions.delete_useless_files(req.body.useless, dir + 'exercises/', tabOfName, files).then((tabOfName_bis) => {
              upload_functions.create_new_tabOfName(dir + 'exercises/', tabOfName_bis).then((new_tabOfName) => {
                upload_functions.create_indexJSON(dir + 'exercises/index.json', new_tabOfName).then((response) => {
                  return res.status(422).json({ errors: { file: "index.json created" } });
                  upload_functions.sendToSwift(dir, server.slug).then((success) => {
                    return res.send({
                      success: true,
                      message: success
                    });
                  }, (err) => {
                    console.log('Error sendToSwift !: ' + err);
                    return res.status(422).json({ errors: { errors: err } });
                  });
                }, (err) => {
                  console.log('Error create index.json !: ' + err);
                  return res.status(422).json({ errors: { errors: err } });
                });
              }, (err) => {
                console.log('Error create newTabOfName !: ' + err);
                return res.status(422).json({ errors: { errors: err } });
              });
            }, (err) => {
              console.log('Error delete useless file !: ' + err);
              return res.status(422).json({ errors: { errors: err } });
            });
          }, (err) => {
            console.log('Error checkfiles !: ' + err);
            return res.status(422).json({ errors: { errors: err } });
          });

        }
      }).catch(next);
  }).catch(next);
});

module.exports = router;
