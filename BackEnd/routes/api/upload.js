/*eslint-disable*/
const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../auth');
const path = require('path');
var dirPath = './uploads/';
var destPath = '';
var save_folder = 'save/';
var archive_folder = 'archive/';
const safe_folder = 'exercises/';
const dirt_folder = 'sandbox/';
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

router.post('/index', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
                }
                var dest_path = dirPath + server.author.username + '/' + server.slug + '/';
                upload_functions.load_tabOfName(dest_path + save_folder).then((groups) => {
                    upload_functions.checkFiles(dest_path + dirt_folder).then((files_sended) => {
                        var files = [];
                        upload_functions.checkFiles(dest_path + safe_folder).then((files_saved) => {
                            files_saved.forEach(element => {
                                if (!files_sended.includes(element)) {
                                    files.push(element);
                                }
                            });
                            return res.json({
                                name: files,
                                group: groups
                            });
                        }, (err) => {
                            console.log('Error checkFiles !: ' + err);
                            return res.status(422).json({ errors: { errors: err } });
                        });
                    }, (err) => {
                        console.log('Error checkFiles !: ' + err);
                        return res.status(422).json({ errors: { errors: err } });
                    });
                }, (err) => {
                    console.log('Error loading tabofName !: ' + err);
                    return res.status(422).json({ errors: { errors: err } });
                });
            }).catch(next);
    }).catch(next);
});

router.post('/check', auth.required, upload.single('file'), function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
                }
                if (!req.file) {
                    console.log("No file received");
                    return res.send({
                        success: false
                    });
                } else {
                    var dest_path = dirPath + server.author.username + '/';
                    var source_path = dirPath + destPath;
                    var mimetype = req.file.mimetype;
                    if (mimetype === 'application/zip' ||
                        mimetype === 'application/octet-stream' ||
                        mimetype === 'application/x-zip-compressed') {
                        console.log('file received');
                        upload_functions.createArbo(dest_path, server.slug + '/', safe_folder, dirt_folder, save_folder).then((response) => {
                            upload_functions.archive_traitement(dest_path + server.slug + '/', source_path, archive_folder, safe_folder, true, '').then((files) => {
                                console.log(files);
                                return res.json({
                                    name: files,
                                });
                            }, (err) => {
                                console.log('Error archive traitement !: ' + err);
                                return res.status(422).json({ errors: { errors: err } });
                            });
                        }, (err) => {
                            console.log('Error createArbo !: ' + err);
                            return res.status(422).json({ errors: { errors: err } });
                        });
                    } else {
                        console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
                        return res.status(422).json({ errors: { file: 'must be exercises.zip found ' + req.file.mimetype } });
                    }
                }
            }).catch(next);
    }).catch(next);
});


router.post('/full', auth.required, upload.single('file'), function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } });
                }
                if (!req.file) {
                    console.log("No file received");
                    return res.send({
                        success: false
                    });
                } else {
                    var dest_path = dirPath + server.author.username + '/';
                    var source_path = dirPath + destPath;
                    var mimetype = req.file.mimetype;
                    if (mimetype === 'application/zip' ||
                        mimetype === 'application/octet-stream' ||
                        mimetype === 'application/x-zip-compressed') {
                        console.log('file received');
                        upload_functions.createArbo(dest_path, server.slug + '/', safe_folder, dirt_folder, save_folder).then((response) => {
                            upload_functions.archive_traitement(dest_path + server.slug + '/', source_path, archive_folder, safe_folder).then((files) => {
                                upload_functions.archive_traitement_repsync(dest_path + server.slug + '/', safe_folder, server.slug).then(() => {
                                    console.log(files + ' ok');
                                    return res.json({
                                        name: files,
                                    });

                                }, (err) => {
                                    console.log('Error archive traitement full !: ' + err);
                                    return res.status(422).json({ errors: { errors: err } });
                                });

                            }, (err) => {
                                console.log('Error archive traitement !: ' + err);
                                return res.status(422).json({ errors: { errors: err } });
                            });
                        }, (err) => {
                            console.log('Error createArbo !: ' + err);
                            return res.status(422).json({ errors: { errors: err } });
                        });
                    } else {
                        console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
                        return res.status(422).json({ errors: { file: 'must be exercises.zip found ' + req.file.mimetype } });
                    }
                }
            }).catch(next);
    }).catch(next);
});


router.post('/url', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
                console.log(req.body);
                var file_url = req.body.url.url + '/archive/master.zip';
                var DOWNLOAD_DIR = './downloads/';
                var dest_path = dirPath + server.author.username + '/';
                if (upload_functions.parse_url(file_url) !== 'github.com') {
                    return res.status(422).json({ errors: { errors: ': URL invalid' } });
                }
                upload_functions.createArbo(dest_path, server.slug + '/', safe_folder, dirt_folder, save_folder).then((response) => {
                    upload_functions.createDir(dest_path + server.slug + '/' + DOWNLOAD_DIR).then(() => {
                        upload_functions.download_from_url(file_url, dest_path + server.slug + '/' + DOWNLOAD_DIR).then((source_path) => {
                            upload_functions.archive_traitement(dest_path + server.slug + '/', source_path, archive_folder, safe_folder).then((files) => {
                                console.log(files);
                                return res.json({
                                    name: files,
                                });
                            }, (err) => {
                                console.log('Error archive traitement !: ' + err);
                                return res.status(422).json({ errors: { errors: err } });
                            });
                        }, (err) => {
                            console.log('Error createArbo !: ' + err);
                            return res.status(422).json({ errors: { errors: err } });
                        });
                    }, (err) => {
                        console.log('Error getRepo !: ' + err);
                        return res.status(422).json({ errors: { errors: err } });
                    });
                }, (err) => {
                    console.log('Error download from url !: ' + err);
                    var message = upload_errors.wget_error(err.code) + err.message;
                    return res.status(422).send({ errors: { message } });
                });
            }).catch(next);
    }).catch(next);
});


router.post('/send', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
                var dir = './uploads/' + server.author.username + '/' + server.slug + '/';
                var tabOfName = req.body.list;
                if (!tabOfName || tabOfName === undefined || !tabOfName.length || (tabOfName.length == 1 && tabOfName[0].length < 2)) {
                    return res.status(422).send({ errors: { file: ": No groups received" } });
                }
                if (upload_errors.group_duplicate(tabOfName)) {
                    return res.status(422).send({ errors: { file: ": Error in groups names, duplicate name" } });
                }
                var test = false;
                user.startProcessing().then(() => {
                    console.log('user.processing : ' + user.processing);
                    upload_functions.checkFiles(dir + safe_folder).then((files) => {
                        upload_functions.copyDir(dir + safe_folder, dir + dirt_folder).then((ok) => {
                            upload_functions.delete_useless_files(req.body.useless, dir + dirt_folder, tabOfName, files).then((tabOfName_bis) => {
                                upload_functions.create_new_tabOfName(dir + save_folder, dir + dirt_folder, tabOfName_bis).then((new_tabOfName) => {

                                    if (test) {

                                        user.endProcessing().then(() => {
                                            console.log('user.processing : ' + user.processing);
                                            return res.send({
                                                success: true,
                                                message: 'ok'
                                            });
                                        });

                                    } else {

                                        upload_functions.create_indexJSON(dir + dirt_folder + 'index.json', new_tabOfName).then((response) => {
                                            // return res.status(422).json({ errors: { file: "index.json created" } });
                                            upload_functions.sendToSwift(dir + dirt_folder, server.slug).then((success) => {
                                                user.endProcessing().then(() => {
                                                    console.log('user.processing : ' + user.processing);
                                                    return res.send({
                                                        success: true,
                                                        message: 'ok'
                                                    });
                                                });
                                            }, (err) => {
                                                console.log('Error sendToSwift !: ' + err);
                                                user.endProcessing().then(() => {
                                                    return res.status(422).json({ errors: { errors: err } });
                                                });
                                            });
                                        }, (err) => {
                                            console.log('Error create index.json !: ' + err);
                                            user.endProcessing().then(() => {
                                                return res.status(422).json({ errors: { errors: err } });
                                            });
                                        });

                                    }

                                }, (err) => {
                                    console.log('Error create newTabOfName !: ' + err);
                                    user.endProcessing().then(() => {
                                        return res.status(422).json({ errors: { errors: err } });
                                    });
                                });
                            }, (err) => {
                                console.log('Error delete useless file !: ' + err);
                                user.endProcessing().then(() => {
                                    return res.status(422).json({ errors: { errors: err } });
                                });
                            });
                        }, (err) => {
                            console.log('Error copy directory !: ' + err);
                            user.endProcessing().then(() => {
                                return res.status(422).json({ errors: { errors: err } });
                            });
                        });
                    }, (err) => {
                        console.log('Error checkfiles !: ' + err);
                        user.endProcessing().then(() => {
                            return res.status(422).json({ errors: { errors: err } });
                        });
                    });
                });
            }).catch(next);
    }).catch(next);
});

router.post('/delete', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(401); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(404).json({ errors: { errors: 'Not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) { return res.sendStatus(401).json({ errors: { errors: 'Unauthorized' } }); }
                var dir = './uploads/' + server.author.username + '/' + server.slug + '/';
                var tabOfName = req.body.trash;
                if (!tabOfName || tabOfName === undefined || !tabOfName.length || tabOfName.length == 0) {
                    return res.status(422).send({ errors: { file: ": No groups received" } });
                }
                user.startProcessing().then(() => {
                    console.log('user.processing : ' + user.processing);
                    tabOfName.forEach(element => {

                        upload_functions.removeDir(dir + safe_folder + element).then(() => {
                            console.log(dir + safe_folder + element + ' removed');
                            upload_functions.removeDir(dir + dirt_folder + element).then(() => {
                                console.log(dir + dirt_folder + element + ' removed');


                            }, (err) => {
                                console.log('Error removeDir !: ' + err);
                                user.endProcessing().then(() => {
                                    return res.status(422).json({ errors: { errors: err } });
                                });
                            });

                        }, (err) => {
                            console.log('Error removeDir !: ' + err);
                            user.endProcessing().then(() => {
                                return res.status(422).json({ errors: { errors: err } });
                            });
                        });

                    });
                    user.endProcessing().then(() => {
                        console.log('user.processing : ' + user.processing);

                        return res.sendStatus(204);
                    });
                }, (err) => {
                    console.log('Error unlinkSync !: ' + err);
                    user.endProcessing().then(() => {
                        return res.status(422).json({ errors: { errors: err } });
                    });
                });

            }).catch(next);
    }).catch(next);
});

module.exports = router;