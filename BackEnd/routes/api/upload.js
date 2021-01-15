/*eslint-disable*/
const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../auth');
const path = require('path');
const api_code = require('../../configs/api_code');

const dirPath = './uploads/';
var destPath = '';

const save_folder = 'save/';
const archive_folder = 'archive/';
const download_folder = 'download/';
const safe_folder = 'exercises/';
const dirt_folder = 'sandbox/';

/** Used when uploading a "ready to launch" archive */
const uploadDir = 'upload/';

const indexJSON = 'index.json';
const archive_extension = 'zip';

const repositoryName = 'repository';
const repositoryDir = repositoryName + '/';
const repositoryArchive = repositoryName + '.' + archive_extension;
const syncName = 'sync';
const syncDir = syncName + '/';
const syncArchive = syncName + '.' + archive_extension;

const exercisesDir = 'exercises/';

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

// Preload server objects on routes with ':server'
router.param('server', function (req, res, next, slug) {
    Server.findOne({ slug: slug })
        .populate('author')
        .then(function (server) {
            if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server ' + slug + ' not found' } }); }

            req.server = server;

            return next();
        }).catch(next);
});

router.get('/', auth.required, function (req, res) {
    res.end('file catcher example');
});

router.post('/index', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
                }
                var dest_path = dirPath + server.author.username + '/' + server.slug + '/';
                upload_functions.loadIndexJson(dest_path + save_folder)
                    .catch(error => {
                        if (error.code === 'ENOENT') {
                            return [];
                        } else {
                            throw error;
                        }
                    })
                    .then((groups) => {
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
                                return res.status(api_code.error).json({ errors: { errors: err.message } });
                            });
                        }, (err) => {
                            console.log('Error checkFiles !: ' + err);
                            return res.status(api_code.error).json({ errors: { errors: err.message } });
                        });
                    }, (err) => {
                        console.log('Error loading tabofName !: ' + err);
                        return res.status(api_code.error).json({ errors: { errors: err.message } });
                    });
            }).catch(next);
    }).catch(next);
});

router.post('/check', auth.required, upload.single('file'), function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
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
                        upload_functions.createArbo(dest_path, server.slug + '/', safe_folder, dirt_folder, save_folder, download_folder).then((response) => {
                            upload_functions.archive_traitement(dest_path + server.slug + '/', source_path, archive_folder, safe_folder, true, '').then((files) => {
                                console.log(files);
                                return res.json({
                                    name: files,
                                });
                            }, (err) => {
                                console.log('Error archive traitement !: ' + err);
                                return res.status(api_code.error).json({ errors: { errors: err.message } });
                            });
                        }, (err) => {
                            console.log('Error createArbo !: ' + err);
                            return res.status(api_code.error).json({ errors: { errors: err.message } });
                        });
                    } else {
                        console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
                        return res.status(api_code.error).json({ errors: { file: 'must be exercises.zip found ' + req.file.mimetype } });
                    }
                }
            }).catch(next);
    }).catch(next);
});


router.post('/full', auth.required, upload.single('file'), function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) {
                    console.log(server.author.username);
                    console.log(user.username);
                    return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
                }
                if (!req.file) {
                    console.log("No file received");
                    return res.send({
                        success: false
                    });
                } else {
                    let userDirPath = dirPath + server.author.username + '/';
                    let serverDir = server.slug + '/';
                    let serverDirPath = userDirPath + serverDir;
                    let archiveFilePath = dirPath + destPath;
                    let uploadDirPath = serverDirPath + uploadDir;
                    let swiftDirPath = uploadDirPath + archive_folder;

                    let repositoryDirPath = uploadDirPath + repositoryDir;
                    let repositoryNamePath = swiftDirPath + repositoryName;
                    let syncDirPath = uploadDirPath + syncDir;
                    let syncNamePath = swiftDirPath + syncName;
                    let exercisesPath = repositoryDirPath + exercisesDir;

                    let indexJSONPath = exercisesPath + indexJSON;
                    let saveIndexJSONPath = serverDirPath + save_folder + indexJSON;
                    let safePath = serverDirPath + safe_folder;
                    let dirtPath = serverDirPath + dirt_folder;

                    let mimetype = req.file.mimetype;
                    if (mimetype === 'application/zip' ||
                        mimetype === 'application/octet-stream' ||
                        mimetype === 'application/x-zip-compressed') {
                        console.log('full archive file received');
                        upload_functions.createArbo(userDirPath, serverDir, safe_folder,
                            dirt_folder, save_folder, download_folder)
                            .catch(err => upload_errors.wrap_error('createArbo', api_code.error, err))

                            .then(() => upload_functions.removeDir(uploadDirPath))
                            .catch(err => upload_errors.wrap_error('removeDir', api_code.error, err))

                            .then(() => upload_functions.createDir(uploadDirPath))
                            .then(() => upload_functions.createDir(swiftDirPath))
                            .catch(err => upload_errors.wrap_error('createDir', api_code.error, err))

                            .then(() => upload_functions.desarchived(uploadDirPath, archiveFilePath))
                            .catch(err => upload_errors.wrap_error('desarchived', api_code.error, err))

                            .then(() => upload_functions.removeDir(archiveFilePath))

                            .then(() => upload_functions.copyFile(indexJSONPath, saveIndexJSONPath))
                            .catch(err => upload_errors.wrap_error('copyFile', api_code.error, err))

                            .then(() => upload_functions.copyDir(exercisesPath, safePath))
                            .then(() => upload_functions.copyDir(exercisesPath, dirtPath))
                            .catch(err => upload_errors.wrap_error('copyDir', api_code.error, err))

                            .then(() => upload_functions.createArchiveFromDirectory(repositoryDirPath, repositoryDir,
                                                                                    archive_extension, repositoryNamePath))
                            .catch(err => upload_errors.wrap_error('createArchiveFromDirectory sync', api_code.error, err))
                            .then(() => upload_functions.sendToSwift(path.resolve(swiftDirPath + repositoryArchive),
                                                                     server.slug, repositoryArchive))
                            .catch(err => upload_errors.wrap_error('sendToSwift', api_code.error, err))
                            .then(() => upload_functions.fileExists(syncDirPath))
                            .then(async syncExists => {
                                console.log("syncExists");
                                console.log(syncExists);
                                if(syncExists) {
                                    await upload_functions.createArchiveFromDirectory(syncDirPath, syncDir,
                                                                                      archive_extension, syncNamePath)
                                        .catch(err => upload_errors.wrap_error('createArchiveFromDirectory sync',
                                                                               api_code.error, err))
                                        .then(() => upload_functions.sendToSwift(path.resolve(swiftDirPath + syncArchive),
                                                                                 server.slug, syncArchive))
                                        .catch(err => upload_errors.wrap_error('sendToSwift', api_code.error, err));
                                }})
                            .then(() => res.sendStatus(api_code.ok))
                            .catch(err => upload_errors.unwrap_error(res, err));
                    } else {
                        console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
                        return res.status(api_code.error)
                            .json({ errors: { file: 'must be exercises.zip found ' + req.file.mimetype } });
                    }
                }
            }).catch(next);
    }).catch(next);
});


router.post('/url', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
                console.log(req.body);
                var file_url = req.body.url.url + '/archive/master.zip';
                var DOWNLOAD_DIR = './downloads/';
                var dest_path = dirPath + server.author.username + '/';
                if (upload_functions.parse_url(file_url) !== 'github.com') {
                    return res.status(api_code.error).json({ errors: { errors: ': URL invalid' } });
                }
                upload_functions.createArbo(dest_path, server.slug + '/', safe_folder, dirt_folder, save_folder, download_folder).then((response) => {
                    upload_functions.createDir(dest_path + server.slug + '/' + DOWNLOAD_DIR).then(() => {
                        upload_functions.download_from_url(file_url, dest_path + server.slug + '/' + DOWNLOAD_DIR).then((source_path) => {
                            upload_functions.archive_traitement(dest_path + server.slug + '/', source_path, archive_folder, safe_folder).then((files) => {
                                console.log(files);
                                return res.json({
                                    name: files,
                                });
                            }, (err) => {
                                console.log('Error archive traitement !: ' + err);
                                return res.status(api_code.error).json({ errors: err });
                            });
                        }, (err) => {
                            console.log('Error createArbo !: ' + err);
                            return res.status(api_code.error).json({ errors: { errors: err.message } });
                        });
                    }, (err) => {
                        console.log('Error getRepo !: ' + err);
                        return res.status(api_code.error).json({ errors: { errors: err.message } });
                    });
                }, (err) => {
                    console.log('Error download from url !: ' + err);
                    var message = upload_errors.wget_error(err.code) + err.message;
                    return res.status(api_code.error).send({ errors: { message } });
                });
            }).catch(next);
    }).catch(next);
});


router.post('/send', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        Server.findOne({ slug: req.body.server })
            .populate('author')
            .then(function (server) {
                if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Not found' } }); }
                if ((server.author.username !== user.username) && (!user.isAdmin())) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
                var dir = './uploads/' + server.author.username + '/' + server.slug + '/';
                var tabOfName = req.body.list;
                if (!tabOfName || tabOfName === undefined || !tabOfName.length || (tabOfName.length == 1 && tabOfName[0].length < 2)) {
                    return res.status(api_code.error).send({ errors: { file: ": No groups received" } });
                }
                if (upload_errors.group_duplicate(tabOfName)) {
                    return res.status(api_code.error).send({ errors: { file: ": Error in groups names, duplicate name" } });
                }
                user.startProcessing()
                    .then(() => console.log('user.processing : ' + user.processing))
                    .then(async () => {
                        let trash = req.body.trash;
                        console.log("trash");
                        console.log(trash);
                        if(Array.isArray(trash)) {
                            await Promise.all(trash.map(exercise => {
                                let safeExercisePath =
                                    path.resolve(dir, safe_folder, exercise),
                                    dirtExercisePath =
                                    path.resolve(dir, dirt_folder, exercise);
                                return upload_functions.removeDir(safeExercisePath)
                                    .catch(err => upload_errors.wrap_error('removeDir',api_code.error, err))
                                    .then(() => console.log(safeExercisePath +
                                                            ' removed'))
                                    .then(() => upload_functions.removeDir(dirtExercisePath))
                                    .catch(err => upload_errors.wrap_error('removeDir',api_code.error, err))
                                    .then(() => console.log(dirtExercisePath +
                                                            ' removed'));
                            }));

                        }
                    })
                    .then(() => upload_functions.checkFiles(dir + safe_folder))
                    .catch(err => upload_errors.wrap_error('checkFiles', api_code.error, err))
                    .then((files) =>
                        upload_functions.copyDir(dir + safe_folder, dir + dirt_folder)
                            .catch(err => upload_errors.wrap_error('copyDir', api_code.error, err))
                            .then(() => upload_functions.delete_useless_files(req.body.useless, dir + dirt_folder,
                                                                              tabOfName, files))
                            .catch(err => upload_errors.wrap_error('delete_useless_files', api_code.error, err)))
                    .then((tabOfName_bis) => upload_functions.create_new_tabOfName(dir + save_folder,
                                                                                   dir + dirt_folder,
                                                                                   tabOfName_bis))
                    .catch(err => upload_errors.wrap_error('create_new_tabOfName', api_code.error, err))
                    .then((new_tabOfName) => {
                        let sourcePath = dir + dirt_folder;
                        let destPath = repositoryDir + exercisesDir;
                        let archivePath = sourcePath + archive_folder;
                        let repositoryPath = archivePath + repositoryName;
                        upload_functions.create_indexJSON(dir + dirt_folder + 'index.json', new_tabOfName)
                            .catch(err => upload_errors.wrap_error('create_indexJSON', api_code.error, err))

                            .then(() => upload_functions.createDir(dir + dirt_folder + archive_folder))
                            .catch(err => upload_errors.wrap_error('createDir', api_code.error, err))

                            .then(() => upload_functions.copyFile(dir + save_folder + indexJSON,
                                                                  sourcePath + indexJSON))
                            .catch(err => upload_errors.wrap_error('copyFile index.json', api_code.error, err))

                            .then(() => upload_functions.createArchiveFromDirectory(sourcePath, destPath,
                                                                                    archive_extension,
                                                                                    repositoryPath))
                            .catch(err => upload_errors.wrap_error('createArchiveFromDirectory', api_code.error, err))

                            .then(() => upload_functions.sendToSwift(path.resolve(archivePath + repositoryArchive),
                                                                     server.slug, repositoryArchive))
                            .catch(err => upload_errors.wrap_error('sendToSwift', api_code.error, err))

                            .then(() => upload_functions.removeDir(archivePath))
                            .catch(err => upload_errors.wrap_error('archivePath', api_code.error, err))

                            .finally(() => user.endProcessing())
                            .finally(() => console.log('user.processing : ' + user.processing))
                            .then(() => res.send({ success: true, message: 'ok' }))
                            .catch(err => upload_errors.unwrap_error(res, err)); 
                    }).catch(next);
            }).catch(next);
    });
});

router.post('/download/:server', auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (!user.isAdmin() && !user.authorized) { return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } }); }
        if (user.processing) { return res.sendStatus(api_code.forbidden); }
        var server = req.server;
        if ((server.author.username !== user.username) && (!user.isAdmin())) {
            console.log(server.author.username);
            console.log(user.username);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        user.startProcessing().then(() => {
            console.log('user.processing : ' + user.processing);
            var dest_path = dirPath + server.author.username + '/' + server.slug + '/';
            // console.log(req);
            var target = req.body.target;
            console.log("target to download");
            console.log(target);
            if (!(target === 'all' || target === 'sync' || target === 'repository')) {
                target = 'all';
            }
            upload_functions.createArbo(dirPath + server.author.username + '/', server.slug + '/', safe_folder, dirt_folder, save_folder, download_folder).then(() => {
                upload_functions.getFromSwift(path.resolve(dest_path + download_folder), server.slug, target).then(() => {
                    var folderName = target;
                    if (folderName === 'all') {
                        let downloadPathDir = dest_path + download_folder;
                        let allPath = downloadPathDir + folderName;
                        let allPathDir = allPath + '/';
                        upload_functions.removeDir(allPath + '.' + archive_extension)
                            .then(() => upload_functions.removeDir(allPathDir))
                            .catch(err => upload_errors.wrap_error('removeDir', api_code.error, err))

                            .then(() => upload_functions.createDir(allPathDir))
                            .catch(err => upload_errors.wrap_error('createDir', api_code.error, err))

                            .then(() => upload_functions.desarchived(allPathDir, downloadPathDir + repositoryArchive))
                            .then(() => upload_functions.fileExists(downloadPathDir + syncArchive))
                            .then(syncExist => (syncExist) ? upload_functions.desarchived(allPathDir,
                                downloadPathDir + syncArchive)
                                : undefined)
                            .catch(err => upload_errors.wrap_error('desarchived', api_code.error, err))

                            .then(() => upload_functions.createArchiveFromDirectory(allPathDir, '',
                                archive_extension, allPath))
                            .catch(err => upload_errors.wrap_error('createArchiveFromDirectory', api_code.error, err))

                            .then(() => user.endProcessing())
                            .then(() => console.log('user.processing : ' + user.processing))
                            .then(() => res.sendFile(path.resolve(allPath + '.' + archive_extension)))

                            .catch(err => upload_errors.unwrap_error(res, err));
                    } else {
                        user.endProcessing().then(() => {
                            console.log('user.processing : ' + user.processing);
                            res.sendFile(path.resolve(dest_path + download_folder + folderName + '.' + archive_extension));
                        });
                    }
                }, (err) => {
                    console.log('Error getFromSwift !: ' + err);
                    user.endProcessing().then(() => {
                        return res.status(api_code.error).json({ errors: { errors: err.message } });
                    });
                });
            }, (err) => {
                console.log('Error create arbo !: ' + err);
                user.endProcessing().then(() => {
                    return res.status(api_code.error).json({ errors: { errors: err.message } });
                });
            });
        });
    }).catch(next);
});

module.exports = router;

