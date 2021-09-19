import { Router } from 'express';
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var User = mongoose.model('User');
const defaultContainerName = require('../../configs/OS').defaultContainerName;

import auth from '../auth';

import * as server_functions from '../../lib/server_functions';
import * as log_functions from '../../lib/log_functions';

import api_code from '../../configs/api_code';
import log_message from '../../configs/log_message';

const router = Router();

// Preload server objects on routes with ':server'
router.param('server', function (req : any, res, next, slug) {
    Server.findOne({ slug: slug })
        .populate('author')
        .then(function (server : any) {
            if (!server) { return res.sendStatus(api_code.not_found).json({ errors: { errors: 'Server ' + slug + ' not found' } }); }

            req.server = server;

            return next();
        }).catch(next);
});

router.get('/', auth.required, function (req : any, res, next) {

    User.findById(req.payload.id).then(function (user : any) {
        if (!user) {
            log_functions.create('error', 'get /server/',
                                 log_message.user_account_unknown + user,
                                 user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'get /server/',
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }

        if ((user.username !== req.query.author) && !user.isAdmin()) {
            log_functions.create('error', 'get /server/',
                log_message.user_owner_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        var author = req.query.author;
        user.findAnUser(author).then(function (results : any) {

            author = results[0];
            console.log(author);
            user.findAllServersOfAnUser(req.query, author, req.payload)
                .then(function (results : any) {
                var servers = results[0];
                var serversCount = results[1];
                log_functions.create('general', 'get /server/', 'ok', user, req.server)
                return res.json({
                    servers: servers.map(function (server : any) {
                        return server.toJSONFor(author);
                    }),
                    serversCount: serversCount
                });
            });
        }).catch(next);
    }).catch(next);

});

router.post('/', auth.required, function (req : any, res, next) {
    User.findById(req.payload.id).then(function (user : any) {
        if (!user) {
            log_functions.create('error', 'post /server/',
                log_message.user_account_unknown + user, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.active) {
            log_functions.create('error', 'post /server/',
                log_message.user_account_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'post /server/',
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        var server = new Server(req.body.server);
        server.author = user;
        log_functions.create('bin', 'post /server/', log_message.user_server_created, user, server);
        return server.save().then(function () {
            server_functions.createSwiftContainer(server.slug)
                .then(() => {
                    server_functions.copySwiftContainer(defaultContainerName, server.slug)
                        .then(() => {
                    log_functions.create('general', 'post /server/', log_message.user_swift_created, user, server);
                    console.log('swift created');
                    return res.json({ server: server.toJSONFor(user) });
                });
            }, (err : any) => {
                log_functions.create('error', 'post /server/',
                    log_message.user_swift_error, user, server);
                return res.status(api_code.error).send({ errors: { err } });
            });
        });

    }).catch(next);
});

// return a server
router.get('/:server', auth.required, function (req : any, res, next) {
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        req.server.populate('author').execPopulate(),

    ]).then(function (results) {
        var user = results[0];
        var server = req.server.toJSONFor(user);
        if (!user) {
            log_functions.create('error', 'get /server/:' + req.server.slug,
                log_message.user_account_unknown + user, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'get /server/:' + req.server.slug,
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }

        if ((user.username !== server.author.username) && (!user.isAdmin())) {
            log_functions.create('error', 'get /server/:' + req.server.slug,
                log_message.user_account_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        log_functions.create('general', 'get /server/:' + req.server.slug, 'ok', user, req.server);
        return res.json({ server });

    }).catch(next);
});

// update server
router.put('/:server', auth.required, function (req : any, res, next) {
    User.findById(req.payload.id).then(function (user : any) {
        if (!user.active) {
            log_functions.create('error', 'put /server/:' + req.server.slug,
                log_message.user_account_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'put /server/:' + req.server.slug,
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (user.processing) {
            log_functions.create('error', 'put /server/:' + req.server.slug,
                log_message.user_processing_unauthorised, user, req.server);
            return res.sendStatus(api_code.forbidden);
        }
        if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

            if (typeof req.body.server.title !== 'undefined') {
                req.server.title = req.body.server.title;
            }

            if (typeof req.body.server.description !== 'undefined') {
                req.server.description = req.body.server.description;
            }

            if (typeof req.body.server.body !== 'undefined') {
                req.server.body = req.body.server.body;
            }

            req.server.save().then(function (server : any) {
                log_functions.create('bin', 'put /server/:' + req.server.slug, 'server information updated', user, req.server);
                return res.json({ server: server.toJSONFor(user) });
            }).catch(next);
        } else {
            log_functions.create('error', 'put /server/:' + req.server.slug,
                log_message.user_owner_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
    });
});

//disable or enable a server
router.post('/disable/:server', auth.required, function (req : any, res, next) {
    User.findById(req.payload.id).then(function (user : any) {
        if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {
            if (!user.active) {
                log_functions.create('error', 'post /server/disable/:' + req.server.slug,
                    log_message.user_account_error, user, req.server);
                return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
            }
            if (!user.isAdmin() && !user.authorized) {
                log_functions.create('error', 'post /server/disable/:' + req.server.slug,
                    log_message.user_activated_error, user, req.server);
                return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
            }
            if (user.processing) {
                log_functions.create('error', 'post /server/disable/:' + req.server.slug,
                    log_message.user_processing_unauthorised, user, req.server);
                return res.sendStatus(api_code.forbidden);
            }

            var slug = req.server.slug;
            var username = req.server.author.username;
            var namespace = 'default';

            if (req.server.active) {
                console.log('shut_off');
                var volume = req.server.volume;
                console.log('volume : ' + volume);
                user.startProcessing().then(() => {
                    log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.user_processing_start, user);
                    console.log('user.processing : ' + user.processing);
                    server_functions.removekubelink(slug, namespace)
                        .then((response : any) => {
                        user.endProcessing().then(() => {
                            log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.user_processing_end, user);
                            console.log('user.processing : ' + user.processing);
                            req.server.active = false;
                            req.server.save().then(function () {
                                log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.server_shut_off, user, req.server);
                                return res.sendStatus(api_code.ok);
                            });
                        });
                        }, (err : any) => {
                        user.endProcessing().then(() => {
                            log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.server_shut_off, user);
                            return res.status(api_code.error).send({ errors: { err } });
                        });
                    });
                });
            } else {
                console.log('shut_on');
                user.startProcessing().then(() => {
                    log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.user_processing_start, user);
                    console.log('user.processing : ' + user.processing);
                    server_functions.createkubelink(slug, username, namespace)
                        .then((response : any) => {
                        user.endProcessing().then(() => {
                            log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.user_processing_end, user);
                            console.log('user.processing : ' + user.processing);
                            req.server.volume = response;
                            req.server.active = true;
                            req.server.save().then(function () {
                                log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.server_shut_on, user, req.server);
                                return res.sendStatus(api_code.ok);
                            });
                        });
                        }, (err : any) => {
                        user.endProcessing().then(() => {
                            log_functions.create('bin', 'post /server/disable/:' + req.server.slug, log_message.user_processing_end, user);
                            return res.status(api_code.error).send({ errors: { err } });
                        });
                    });
                });
            }
        } else {
            log_functions.create('error', 'get /server/disable/:' + req.server.slug,
                log_message.user_owner_error, user, req.server);
            return res.sendStatus(api_code.forbidden);
        }
    }).catch(next);
});

// delete server
router.delete('/:server', auth.required, function (req : any, res, next) {
    User.findById(req.payload.id).then(function (user : any) {
        if (!user) {
            log_functions.create('error', 'delete /server/:' + req.server.slug,
                log_message.user_account_unknown + user, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.active) {
            log_functions.create('error', 'delete /server/:' + req.server.slug,
                log_message.user_account_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'delete /server/:' + req.server.slug,
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (user.processing) {
            log_functions.create('error', 'delete /server/:' + req.server.slug,
                log_message.user_processing_unauthorised, user, req.server);
            return res.sendStatus(api_code.forbidden);
        }

        if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

            var slug = req.server.slug;
            var namespace = 'default';
            console.log('asking for a deletion');
            console.log('slug : ' + slug);
            console.log('namespace : ' + namespace);
            log_functions.create('bin', 'delete /server/:' + req.server.slug, log_message.user_deletion_ask, user, req.server);

            user.startProcessing().then(() => {
                log_functions.create('bin', 'delete /server/:' + req.server.slug, log_message.user_processing_start, user);
                server_functions.deleteAll(slug, namespace, './uploads/' + user.username + '/' + slug + '/').then((response : any) => {
                    user.endProcessing().then(() => {
                        log_functions.create('bin', 'delete /server/:' + req.server.slug, log_message.user_processing_end, user);
                        log_functions.create('bin', 'delete /server/:' + req.server.slug, log_message.server_deletion_ok, user, req.server).then(() => {
                            return req.server.remove().then(function () {
                                return res.sendStatus(api_code.ok);
                            });
                        })
                    });
                }, (err : any) => {
                    user.endProcessing().then(() => {
                        console.error(err);
                        log_functions.create('bin', 'delete /server/:' + req.server.slug, log_message.user_processing_end, user);
                        return res.status(api_code.error).send({ errors: { err } });
                    });
                });
            });
        } else {
            log_functions.create('error', 'delete /server/:' + req.server.slug,
                log_message.user_owner_error, user, req.server);
            return res.sendStatus(api_code.forbidden);
        }
    }).catch(next);
});

router.post('/token/:server', auth.required, function (req : any, res, next) {
    User.findById(req.payload.id).then(function (user : any) {
        if (!user) {
            log_functions.create('error', 'post /server/:' + req.server.slug,
                log_message.user_account_unknown + user, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.active) {
            log_functions.create('error', 'post /server/:' + req.server.slug,
                log_message.user_account_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }
        if (!user.isAdmin() && !user.authorized) {
            log_functions.create('error', 'post /server/:' + req.server.slug,
                log_message.user_activated_error, user, req.server);
            return res.sendStatus(api_code.forbidden).json({ errors: { errors: 'Unauthorized' } });
        }

        if (req.server.author._id.toString() === req.payload.id.toString() || user.isAdmin()) {

            if (req.server.token !== undefined) {
                console.log(req.server.token);
                return res.status(api_code.error).send({ errors: 'teacher token already retrieve' });
            } else {
                var slug = req.server.slug;
                var namespace = 'default';
                user.startProcessing().then(() => server_functions.catchTeacherToken(slug, namespace))
                    .then((token : any) => {
                        log_functions.create('bin', 'post /server/token:' + req.server.slug, log_message.user_token_ok, user, req.server);
                        req.server.token = token;
                        return req.server.save();
                    })
                    .then(() => user.endProcessing())
                    .then(() => res.json({ server: req.server.toJSONFor(user) }))
                    .catch(async (err : any) => {
                        await user.endProcessing();
                        log_functions.create('error', 'post /server/',
                            log_message.user_token_error + req.server.slug,
                            user, req.server);
                        return res.status(api_code.error).send({ errors: { err } });
                    });
            }
        } else {
            log_functions.create('error', 'get /server/disable/:' + req.server.slug,
                log_message.user_owner_error, user, req.server);
            return res.sendStatus(api_code.forbidden);
        }
    }).catch(next);
});

module.exports = router;
