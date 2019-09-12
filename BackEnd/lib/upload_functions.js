var fs = require('fs');
var unzipper = require('unzipper');
var url = require('url');
const http = require('http');

var upload_functions = {

    desarchived: function (dest_path, source_path) {
        return new Promise(function (resolve, reject) {
            if (!fs.existsSync(dest_path)) {
                fs.mkdirSync(dest_path);
            }

            fs.createReadStream(source_path).pipe(unzipper.Extract({ path: dest_path })).on('close', function (err) {
                console.log('extracted');
                if (err) {
                    return reject(err);
                }
                return resolve(dest_path);
            });

        });
    },
    checkFiles: function (path) {
        return new Promise(function (resolve, reject) {
            return resolve(fs.readdirSync(path));
        });
    },

    unlinkSync: function (path) {
        return new Promise(function (resolve, reject) {
            return resolve(fs.unlinkSync(path));
        });
    },

    parse_url: function (file_url) {
        return url.parse(file_url).host;
    },

    download_from_url: function (file_url, dest_path) {
        return new Promise(function (resolve, reject) {
            var options = {
                host: url.parse(file_url).host,
                port: 80,
                path: url.parse(file_url).pathname
            };

            var file_name = url.parse(file_url).pathname.split('/').pop();

            var file = fs.createWriteStream(dest_path + file_name);

            http.get(options, function (res) {
                res.on('data', function (data) {
                    file.write(data);
                }).on('end', function () {
                    file.end();
                    return resolve(dest_path + file_name);
                }).on('error', function (err) {
                    return reject(err);
                })
            });
        });
    },


};

module.exports = upload_functions;
