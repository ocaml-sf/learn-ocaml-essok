var mongoose = require('mongoose');
var Log = mongoose.model('Log');

function _create(type, action, message = null, author = null, server = null) {
    return new Promise((resolve, reject) => {
        var log = new Log();
        log.type = type;
        log.action = action;
        log.message = message;
        log.author = author;
        log.server = server;
        return log.save().then(() => {
            console.log(log);
            return resolve(log);
        }, (err) => {
            console.log('Error creating log !: ' + err);
            return reject(err);
        });
    });
}

function _delete(log) {
    return new Promise((resolve, reject) => {
        log.remove().then(() => {
            return resolve();
        }, (err) => {
            console.log('Error deleting log !: ' + err);
            return reject(err);
        });
    });

}

var log_functions = {
    create: _create,
    delete: _delete,
}

module.exports = log_functions;
