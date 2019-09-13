var fs = require('fs');
var unzipper = require('unzipper');
var url = require('url');
const http = require('http');
var child_process = require('child_process');
var rimraf = require("rimraf");

var upload_functions = {
    desarchived: function (dest_path, source_path) {
        return new Promise(function (resolve, reject) {

            fs.createReadStream(source_path).pipe(unzipper.Extract({ path: dest_path }))
                .on('close', function (err) {
                    console.log('extracted');
                    if (err) {
                        return reject(err);
                    }
                    return resolve(dest_path);
                })
                .on('error', function (err) {
                    return reject(err);
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

            var file_name = url.parse(file_url).pathname.split('/').pop();
            var wget = 'wget -P ' + dest_path + ' ' + file_url;

            child_process.exec(wget, function (err, stdout, stderr) {
                if (err) return reject(err);
                else {
                    return resolve(dest_path + file_name);
                }
            });
        });
    },

    // to modify
    delete_useless_files: function (useless, path) {
        return new Promise(function (resolve, reject) {
            if (useless === [] || useless === undefined || useless === null) {
                return resolve('nothing to delete');
            }
            useless.forEach(element => {
                rimraf(path + element, function (err) {
                    if (err) return reject(err);
                })
            });
            return resolve('done');
        });
    },

    create_indexJSON: function (path, tabOfName) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path + 'exercises/index.json', '{ "learnocaml_version": "1",\n  "groups":\n  {\n', function (err) {
                if (err) return reject(err);
            });
            tabOfName = tabOfName.filter(group => group.length >= 2);
            var name = 1;
            for (let i = 0; i < tabOfName.length; i++) {
                var group = tabOfName[i];
                for (let index = 0; index < group.length; index++) {
                    if (index === 0) {
                        fs.appendFile(path + 'exercises/index.json', '    "group-' + name + '":\n    { "title": "' + group[index] + '",\n      "exercises": [\n',
                            function (err) {
                                if (err) return reject(err);
                            });
                    } else if (index === group.length - 1) {
                        fs.appendFile(path + 'exercises/index.json', '                     "' + group[index] + '" ] }',
                            function (err) {
                                if (err) return reject(err);
                            });
                        if (i !== tabOfName.length - 1) {
                            fs.appendFile(path + 'exercises/index.json', ',\n',
                                function (err) {
                                    if (err) return reject(err);
                                });
                        }
                        else {
                            fs.appendFile(path + 'exercises/index.json', '\n',
                                function (err) {
                                    if (err) return reject(err);
                                });
                        }
                    }
                    else {
                        fs.appendFile(path + 'exercises/index.json', '                     "' + group[index] + '",\n',
                            function (err) {
                                if (err) return reject(err);
                            });
                    }
                }
                name++;
            };
            fs.appendFile(path + 'exercises/index.json', '} }', function (err) {
                if (err) return reject(err);
                return resolve(path + 'exercises/index.json');
            });
        });
    },
    sendToSwift: function (path, slug) {
        return new Promise(function (resolve, reject) {

            var readStream = fs.createReadStream(path);
            var writeStream = swiftClient.upload({
                container: slug,
                remote: 'exercises'
            });
            writeStream.on('error', function (err) {
                return reject(err);
            });
            writeStream.on('success', function (file) {
                return resolve('fileUploaded successful : ' + file);
            });
            readStream.pipe(writeStream);
        });
    },
    removeDir: function (path) {
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(path)) {
                rimraf(path, function (err) {
                    if (err) return reject(err);
                    return resolve('removed');
                });
            }
            else { return resolve('removed'); }
        });
    },
    renameDir: function (oldPath, newPath) {
        return new Promise(function (resolve, reject) {
            fs.rename(oldPath, newPath, function (err) {
                reject(err);
            })
            return resolve('renamed');
        })
    },
    createDir: function (path) {
        return new Promise(function (resolve, reject) {
            return fs.mkdir(path, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve('created');
            });
        });
    },

};

module.exports = upload_functions;
