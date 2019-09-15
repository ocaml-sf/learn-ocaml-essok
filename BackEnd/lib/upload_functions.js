var fs = require('fs');
var unzipper = require('unzipper');
var url = require('url');
var child_process = require('child_process');
var rimraf = require("rimraf");
const swiftClient = require('../Client/swiftClient');
const read = require('fs-readdir-recursive');

function asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

function create_IndexJSON_header() {
    return new Promise(function (resolve, reject) {
        return resolve('{ "learnocaml_version": "1",\n  "groups":\n  {\n');
    });
}

function create_IndexJSON_body(tabOfName) {
    return new Promise(function (resolve, reject) {
        var body = "";
        for (let i = 0; i < tabOfName.length; i++) {
            var group = tabOfName[i];
            for (let index = 0; index < group.length; index++) {
                if (index === 0) {
                    body += '    "group-' + i + '":\n    { "title": "' + group[index] + '",\n      "exercises": [\n';

                } else if (index === group.length - 1) {
                    body += '                     "' + group[index] + '" ] }';
                    if (i !== tabOfName.length - 1) {
                        body += ',\n';
                    }
                    else {
                        body += '\n';
                        if (i === tabOfName.length - 1) {
                            return resolve(body);
                        }
                    }
                }
                else {
                    body += '                     "' + group[index] + '",\n';
                }
            }
        };
    });
}

function create_IndexJSON_footer() {
    return new Promise(function (resolve, reject) {
        return resolve('} }');
    });
}

function addFileInTabOfName(element, tmp) {
    return new Promise(function (resolve, reject) {
        var new_group = [];
        for (let i = 0; i < element.length; i++) {
            if (i === 0) {
                new_group.push(element[i]);
            }
            else {
                if (tmp.includes(element[i])) {
                    console.log(tmp + ' contains : ' + element[i] + ' so it will be push in ' + new_group);
                    new_group.push(element[i]);
                    console.log('new_group : ' + new_group);
                }
                if (i == element.length - 1) {
                    console.log('finally new_group : ' + new_group);
                    return resolve(new_group);
                }
            }
        }
    });
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
                    var found = false;
                    for (let i = 0; i < tabOfName.length; i++) {
                        const group = tabOfName[i];
                        if (group.includes(element)) {
                            console.log(path + element + ' is included in tabOfName file, possess an meta.json file and is not included in useless file, so it will be kept');
                            return resolve();
                        }
                        else {
                            if (i === tabOfName.length - 1) {
                                console.log('tabOfName : ' + tabOfName);
                                console.log('group : ' + group);
                                console.log('element : ' + element);
                                console.log('tabOfName doesnt contains element : ' + element + ' in group ' + group);
                                console.log(path + element + ' is not included in tabOfName file, so it will be deleted');
                                return resolve(path + element);
                            }
                        }
                    }
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
        if (tmp === 0) {
            console.log('no more file to delete');
            return resolve();
        }
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

function _desarchived(dest_path, source_path) {
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
}

function _checkFiles(path) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(path)) {
            fs.readdir(path, function (err, files) {
                if (err) return reject(err);
                else if (!files.length) {
                    return reject('File not found');
                }
                else return resolve(files);
            })
        } else {
            return reject('File not found');
        }
    });
}

function _unlinkSync(path) {
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
}

function _download_from_url(file_url, dest_path) {
    return new Promise(function (resolve, reject) {

        var file_name = url.parse(file_url).pathname.split('/').pop();
        var wget = 'wget -P ' + dest_path + ' ' + file_url;

        child_process.exec(wget, function (err, stdout, stderr) {
            if (err) return reject(err);
            return resolve(dest_path + file_name);
        });
    });
}

function _delete_useless_files(useless, path, tabOfName, files) {
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
                            if (!tabOfName.length) {
                                return reject('No file available');
                            } else {
                                return resolve(tabOfName);
                            }
                        })
                    }
                }, (err) => {
                    console.log('Error file_to_delete !: ' + err);
                    return reject(err);
                });
            });
        });
    });
}

function _create_new_tabOfName(path, tabOfName) {
    return new Promise(function (resolve, reject) {

        var nameProcessed = 0;
        var tmp = fs.readdirSync(path);
        var new_tabOfName = [[]];

        tabOfName.forEach((element, index, array) => {
            asyncFunction(element, () => {
                addFileInTabOfName(element, tmp).then((response) => {
                    if (response) {
                        console.log('new group in new_tab_of_name : ' + response);
                        new_tabOfName.push(response);
                        console.log('new_tab_of_name : ' + new_tabOfName);
                    }
                    nameProcessed++;
                    if (nameProcessed === array.length) {
                        console.log('new_tabOfName before filter : ' + new_tabOfName);
                        new_tabOfName = new_tabOfName.filter(group => group.length >= 2);
                        console.log('new_tabOfName after filter : ' + new_tabOfName);
                        if (!new_tabOfName.length) {
                            return reject(': No correct files found for index.json');
                        }
                        else return resolve(new_tabOfName);
                    }
                },
                    (err) => {
                        console.log('Error file_to_delete !: ' + err);
                        return reject(err);
                    });
            });
        });
    });
}

function _create_indexJSON(path, tabOfName) {
    return new Promise(function (resolve, reject) {
        create_IndexJSON_header().then((header) => {
            console.log('header created : \n' + header);
            create_IndexJSON_body(tabOfName).then((body) => {
                console.log('body created : \n' + body);
                create_IndexJSON_footer().then((footer) => {
                    console.log('footer created : \n' + footer);
                    fs.appendFile(path, header + body + footer, function (err) {
                        if (err) return reject(err);
                        console.log('index.json : ' + header + body + footer);
                        return resolve(path + 'exercises/index.json');
                    });
                })
            })
        })
    });
}

function _sendToSwift(path, slug) {
    return new Promise(function (resolve, reject) {
        var nameProcessed = 0;
        console.log(read(path));
        read(path).forEach((element, index, array) => {
            asyncFunction(element, () => {
                var readStream = fs.createReadStream(path + element);
                var writeStream = swiftClient.upload({
                    container: slug,
                    remote: '/repository/exercises/' + element,
                });
                writeStream.on('error', function (err) {
                    console.log('error in upload : ' + err);
                    return reject(err);
                });
                writeStream.on('success', function (file) {
                    console.log('fileUploaded successful : ' + file);
                    nameProcessed++;
                    if (nameProcessed === array.length) {
                        console.log('All file have been uploaded successfully, you can launch your server now !');
                        return resolve('fileUploaded successful : ' + array);
                    }
                });
                readStream.pipe(writeStream);
            });
        });
    });
}

function _removeDir(path) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(path)) {
            rimraf(path, function (err) {
                if (err) return reject(err);
                return resolve('removed');
            });
        }
        else { return resolve('removed'); }
    });
}

function _renameDir(oldPath, newPath, unknown) {
    return new Promise(function (resolve, reject) {
        if (unknown) {
            fs.readdir(oldPath, function (err, files) {
                if (err) return reject(err);
                else {
                    fs.rename(oldPath + files[0], newPath, function (err) {
                        if (err) return reject(err);
                        return resolve('renamed');
                    })
                }
            })
        } else {
            fs.rename(oldPath, newPath, function (err) {
                if (err) return reject(err);
                return resolve('renamed');
            })
        }

    })
}

function _createDir(path) {
    return new Promise(function (resolve, reject) {
        return fs.mkdir(path, function (err) {
            if (err) return reject(err);
            return resolve('created');
        });
    });
}

var upload_functions = {
    desarchived: function (dest_path, source_path) {
        return _desarchived(dest_path, source_path);
    },

    checkFiles: function (path) {
        return _checkFiles(path);
    },

    unlinkSync: function (path) {
        return _unlinkSync(path);
    },

    parse_url: function (file_url) {
        return url.parse(file_url).host;
    },

    download_from_url: function (file_url, dest_path) {
        return _download_from_url(file_url, dest_path);
    },

    delete_useless_files: function (useless, path, tabOfName, files) {
        return _delete_useless_files(useless, path, tabOfName, files);
    },

    create_new_tabOfName: function (path, tabOfName) {
        return _create_new_tabOfName(path, tabOfName);
    },

    create_indexJSON: function (path, tabOfName) {
        return _create_indexJSON(path, tabOfName);
    },

    sendToSwift: function (path, slug) {
        return _sendToSwift(path, slug);
    },

    removeDir: function (path) {
        return _removeDir(path);
    },
    renameDir: function (oldPath, newPath, unknown) {
        return _renameDir(oldPath, newPath, unknown);
    },
    createDir: function (path) {
        return _createDir(path);
    },

};

module.exports = upload_functions;
