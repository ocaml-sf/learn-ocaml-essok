const fs = require('fs');
const fsDir = require('fs-extra');
const unzipper = require('unzipper');
const url = require('url');
const child_process = require('child_process');
const rimraf = require("rimraf");
const swiftClient = require('../clients/swiftClient');
const read = require('fs-readdir-recursive');
const global_functions = require('./global_functions');
const saveFile = 'index_saved.txt'
const separator = '®';
const new_separator = '';

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
                new_group.push(element[i].replace(separator, new_separator));
            }
            else {
                if (tmp.includes(element[i])) {
                    console.log(tmp + ' contains : ' + element[i] + ' so it will be push in ' + new_group);
                    new_group.push(element[i].replace(separator, new_separator));
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
                    return resolve([]);
                }
                else return resolve(files);
            })
        } else {
            return resolve([]);
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
            global_functions.asyncFunction(element, () => {
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

function _create_new_tabOfName(save_path, path, tabOfName) {
    return new Promise(function (resolve, reject) {

        var nameProcessed = 0;
        var tmp = fs.readdirSync(path);
        var new_tabOfName = [[]];

        tabOfName.forEach((element, index, array) => {
            global_functions.asyncFunction(element, () => {
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
                        else {
                            _save_tabOfName(save_path, new_tabOfName).then(() => {
                                _load_tabOfName(save_path).then(() => {
                                    return resolve(new_tabOfName);
                                })
                            });
                        }
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

function _save_tabOfName(save_path, tabOfName) {
    return new Promise(function (resolve, reject) {
        var line = '';
        tabOfName.forEach(tab => {
            tab.forEach(element => {
                line += element + separator;
            });
            line += '\n';
        });

        fs.writeFile(save_path + saveFile, line, function (err) {
            if (err) {
                console.log('error in saving tabofname');
                return reject(err);
            }
            console.log('index_saved created');
            return resolve('ok');
        })
    })
}

function _load_tabOfName(save_path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(save_path + saveFile, 'utf8', function (err, data) {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.error('The save file doesnt exist now, it is the first time the repository is created');
                    return resolve([]);
                } else {
                    return resolve([]);
                    console.log(err);
                    return reject(err);
                }
            } else {
                console.log(data);
                var res = []
                var data_ = data.split('\n');
                for (let index = 0; index < data_.length - 1; index++) {
                    const element = data_[index];
                    var items = element.split(separator);
                    var exercises_ = [];
                    for (let index = 1; index < items.length - 1; index++) {
                        exercises_.push(items[index]);
                    }
                    var group = {
                        title: items[0],
                        exercises: exercises_
                    }
                    res.push(group);
                }
                console.log(res);
                return resolve(res);
            }
        })
    })
}

function _create_indexJSON(path, tabOfName) {
    return new Promise(function (resolve, reject) {
        create_IndexJSON_header().then((header) => {
            console.log('header created : \n' + header);
            create_IndexJSON_body(tabOfName).then((body) => {
                console.log('body created : \n' + body);
                create_IndexJSON_footer().then((footer) => {
                    console.log('footer created : \n' + footer);
                    fs.writeFile(path, header + body + footer, function (err) {
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
            global_functions.asyncFunction(element, () => {
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

function _renameDir(oldPath, newPath, unknown, remove_if_not_empty) {
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
                if (err) {
                    return reject(err);
                }
                return resolve('renamed');
            })
        }

    })
}

function _moveDir(oldPath, newPath) {
    return new Promise(function (resolve, reject) {
        fsDir.move(oldPath, newPath, function (err) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve('ok');
            }
        })

    })
}

function _createDir(path) {
    return new Promise(function (resolve, reject) {
        fs.mkdir(path, function (err) {
            if (err) {
                if (err.code === 'EEXIST') {
                    console.error('my repository already exists');
                } else {
                    return reject(err);
                }
            }
            return resolve('ok');
        });
    });
}

function _createArbo(path, server_name, safe_folder, dirt_folder, save_folder) {
    return new Promise(function (resolve, reject) {
        _createDir(path).then(() => {
            _createDir(path + server_name).then(() => {
                _createDir(path + server_name + safe_folder).then(() => {
                    _createDir(path + server_name + dirt_folder).then(() => {
                        _createDir(path + server_name + save_folder).then(() => {
                            return resolve('done');
                        }, (err) => {
                            console.log('Error creating save_folder !: ' + err);
                            return reject(err);
                        });
                    }, (err) => {
                        console.log('Error creating dirt_folder !: ' + err);
                        return reject(err);
                    });
                }, (err) => {
                    console.log('Error creating safe_folder !: ' + err);
                    return reject(err);
                });
            }, (err) => {
                console.log('Error creating path + server name folder !: ' + err);
                return reject(err);
            });
        }, (err) => {
            console.log('Error creating path_folder !: ' + err);
            return reject(err);
        });

    });
}

function _copyDir(source, destination) {
    return new Promise(function (resolve, reject) {
        fsDir.copy(source, destination, function (err) {
            if (err) {
                console.log('An error occured while copying the folder.')
                return reject(err);
            }
            console.log(source + ' folder has been succefully copied in ' + destination);
            return resolve("ok");
        });
    })
}

function _archive_traitement(dest_path, source_path, archive_folder, safe_folder) {
    return new Promise(function (resolve, reject) {
        _desarchived(dest_path + archive_folder, source_path).then((response) => {
            _checkFiles(dest_path + archive_folder).then((archive_name) => {
                _copyDir(dest_path + archive_folder + archive_name[0], dest_path + safe_folder).then((response) => {
                    _removeDir(dest_path + archive_folder).then(() => {
                        _unlinkSync(source_path).then((response) => {
                            _checkFiles(dest_path + safe_folder).then((files) => {
                                return resolve(files);
                            }, (err) => {
                                console.log('Error checkFiles !: ' + err);
                                return reject(err);
                            });
                        }, (err) => {
                            console.log('Error unlink !: ' + err);
                            return reject(err);
                        });
                    }, (err) => {
                        console.log('Error removeDir !: ' + err);
                        return reject(err);
                    });
                }, (err) => {
                    console.log('Error copydir !: ' + err);
                    return reject(err);
                });
            }, (err) => {
                console.log('Error checkFiles !: ' + err);
                return reject(err);
            });
        }, (err) => {
            console.log('Error desarchived !: ' + err);
            return reject(err);
        });
    });
}

var upload_functions = {
    desarchived: _desarchived,
    checkFiles: _checkFiles,
    unlinkSync: _unlinkSync,
    download_from_url: _download_from_url,
    delete_useless_files: _delete_useless_files,
    create_new_tabOfName: _create_new_tabOfName,
    create_indexJSON: _create_indexJSON,
    sendToSwift: _sendToSwift,
    removeDir: _removeDir,
    renameDir: _renameDir,
    createArbo: _createArbo,
    copyDir: _copyDir,
    load_tabOfName: _load_tabOfName,
    archive_traitement: _archive_traitement,
    createDir: _createDir,
    parse_url: function (file_url) {
        return url.parse(file_url).host;
    },
};

module.exports = upload_functions;
