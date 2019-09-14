var fs = require('fs');
var unzipper = require('unzipper');
var url = require('url');
var child_process = require('child_process');
var rimraf = require("rimraf");

function asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}
function file_to_delete(path, element, useless, tabOfName) {
    return new Promise(function (resolve, reject) {
        fs.stat(path + element, function (err, stat) {
            if (err) return reject(err);
            if (stat.isFile()) {
                console.log(path + element + ' is a file, so it will be deleted');
                fs.unlink(path + element, function (err) {
                    if (err) return reject(err);
                    return resolve();
                });
            }
            else if (stat.isDirectory()) {
                if (!fs.readdirSync(path + element).includes('meta.json')) {
                    console.log(path + element + ' don t contain meta.json file, so it will be deleted');
                    return resolve(path + element);

                }
                else if (useless.includes(element)) {
                    console.log(path + element + ' is included in useless file, so it will be deleted');
                    return resolve(path + element);

                }
                else {
                    tabOfName.forEach(group => {
                        if (!group.includes(element)) {
                            console.log('tabOfName : ' + tabOfName);
                            console.log('group : ' + group);
                            console.log('element : ' + element);
                            console.log('tabOfName doesnt contains element : ' + element + ' in group ' + group);

                            console.log(path + element + ' is not included in tabOfName file, so it will be deleted');
                            return resolve(path + element);
                        }
                        else {
                            console.log(path + element + ' is included in tabOfName file, possess an meta.json file and is not included in useless file, so it will be kept');
                            return resolve();
                        }
                    })
                }
            }
            else {
                return reject('Unknown format');
            }
        });
    });
}
function deleteDir(tab_of_dir) {
    return new Promise(function (resolve, reject) {
        var tmp = tab_of_dir.length;
        console.log('tmp.length : ' + tmp);
        for (let i = 0; i < tab_of_dir.length; i++) {
            rimraf(tab_of_dir[i], function (err) {
                if (err) return reject(err);
                console.log('file deleted in tmp');
                tmp--;
                console.log('tmp.length : ' + tmp);
                if (tmp === 0) {
                    console.log('no more file to delete');
                    return resolve();
                }
            })
        }
    });
}

var upload_functions = {
    desarchived: function (dest_path, source_path) {
        return new Promise(function (resolve, reject) {

            fs.createReadStream(source_path).pipe(unzipper.Extract({ path: dest_path }))
                .on('close', function (err) {
                    if (err) return reject(err);
                    return resolve(dest_path);
                })
                .on('error', function (err) {
                    return reject(err);
                });
        });
    },
    checkFiles: function (path) {
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(path)) {
                fs.readdir(path, function (err, files) {
                    if (err) return reject(err);
                    return resolve(files);
                })
            } else {
                return reject('File not found');
            }
        });
    },

    unlinkSync: function (path) {
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(path)) {
                fs.unlink(path, function (err) {
                    if (err) return reject(err);
                    return resolve('deleted');
                })
            } else {
                return resolve('deleted');
            }
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
                return resolve(dest_path + file_name);
            });
        });
    },

    delete_useless_files: function (useless, path, tabOfName, files) {
        return new Promise(function (resolve, reject) {
            if (useless === [] || useless === undefined || useless === null) {
                return resolve('nothing to delete');
            }
            console.log('tabOfName before filter : ' + tabOfName);
            tabOfName = tabOfName.filter(group => group.length >= 2);
            console.log('tabOfName after filter : ' + tabOfName);

            var tmp = [];
            var itemsProcessed = 0;
            files.forEach((element, index, array) => {
                asyncFunction(element, () => {
                    file_to_delete(path, element, useless, tabOfName).then((response) => {
                        if (response) {
                            console.log(response + ' added in tmp');
                            tmp.push(response);
                        }
                        itemsProcessed++;
                        if (itemsProcessed === array.length) {
                            console.log('tmp : ' + tmp);
                            deleteDir(tmp).then((response) => {
                                console.log('all file deleted');
                                return resolve(tabOfName);
                            })
                        }
                    }, (err) => {
                        console.log('Error file_to_delete !: ' + err);
                        return reject(err);
                    });
                });
            });
        });
    },

    create_new_tabOfName: function (path, tabOfName) {
        return new Promise(function (resolve, reject) {

            var nameProcessed = 0;
            var tmp = fs.readdirSync(path);
            var new_tabOfName = [[]];

            function callback(new_tabOfName) { return resolve(new_tabOfName); }

            tabOfName.forEach((element, index, array) => {
                var new_group = [];
                asyncFunction(element, () => {
                    for (let i = 0; i < element.length; i++) {
                        if (i === 0) {
                            new_group.push(element[0]);
                        }
                        else {
                            if (tmp.includes(element[i])) {
                                console.log(tmp + ' contains : ' + element + ' so it will be push in ' + new_tabOfName);
                                new_group.push(element[i]);
                            }
                            if (i == element.length - 1) {
                                new_tabOfName.push(new_group);
                            }
                        }
                    }
                    nameProcessed++;
                    if (nameProcessed === array.length) {
                        console.log('new_tabOfName before filter : ' + tabOfName);
                        new_tabOfName = new_tabOfName.filter(group => group.length >= 2);
                        console.log('new_tabOfName after filter : ' + tabOfName);
                        return resolve(new_tabOfName);
                    }
                });
            });
        });
    },

    create_IndexJSON_head: function () {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path + 'exercises/index.json', '{ "learnocaml_version": "1",\n  "groups":\n  {\n', function (err) {
                if (err) return reject(err);
            });
        });
    },
    create_indexJSON: function (path, tabOfName) {
        return new Promise(function (resolve, reject) {

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
                if (err) return reject(err);
                return resolve('renamed');
            })

        })
    },
    createDir: function (path) {
        return new Promise(function (resolve, reject) {
            return fs.mkdir(path, function (err) {
                if (err) return reject(err);
                return resolve('created');
            });
        });
    },

};

module.exports = upload_functions;
