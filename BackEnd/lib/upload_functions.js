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
const repository = 'repository/';
const sync = 'sync/';
const archiver = require('archiver');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


const path = require('path');
const fsPromises = fs.promises;

const defaultIndexJsonFilename = 'index.json';
const defaultIndexJsonPath = '../configs/default_index.json';
const groupPrefix = 'group-';

const defaultIndexObj = require(defaultIndexJsonPath);

/**
 * Workaround to convert a tabOfName (a dumb structure of matrix)
 * the dumb structure is like [ [ "g1", "ex1", "ex2", ...], [ "g2", "ex3", ... ] ]
 * to a standart list of groups
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
function tabOfNameToGroups(tabOfName) {
    return tabOfName.map(group => {
        return { title: group[0], exercises: group.slice(1) };
    });
}

/**
 * Load a index.json file to extract the list of groups
 * return a promise with the list of groups
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
async function loadIndexJson(dirPath) {
    const filePath = path.join(dirPath, defaultIndexJsonFilename);

    return fsPromises.readFile(filePath)
        .then(buffer => JSON.parse(buffer))
        .then(indexObject => Object.values(indexObject.groups));
}

/**
 * Save the index.json from a list of groups object
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
async function saveIndexJson(dirPath, groups) {
    const indexObject = Object.assign({}, defaultIndexObj);
    const filePath = path.join(dirPath, defaultIndexJsonFilename);

    for (let i = 0; i < groups.length; i++) {
        indexObject.groups[groupPrefix + i] = groups[i];
    }
    return Promise.resolve(JSON.stringify(indexObject, null, 2))
        .then(buffer => fsPromises.writeFile(filePath, buffer));
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
/**
 *
 * @param {*} source
 * @param {*} dest
 * @param {*} format
 * @param {*} archive_name
 */
async function createArchiveFromDirectory(source, dest, format, archive_name) {
    var files = read(source).map(file => [path.join(source, file), path.join(dest, file)]);
    if (files === []) {
        throw 'empty files list';
    }
    await createArchive(files, format, archive_name);
}

/**
 * Create an archive from list of files
 * files : list of pairs of [path_to_file, archive_path_of_file]
 *         (ex: ['dir1/file1', 'dir2/dir3/file1'])
 * format : format of compression (ex: 'zip')
 * archive_name : the name of the archive
 */
async function createArchive(files, format, archive_name = 'archive') {
    const stream = fs.createWriteStream(archive_name + '.' + format);
    const archive = archiver(format, {});

    await new Promise(resolve => {
        stream.on('close', function () {
            console.log('archive ' + archive + ' created');
            resolve();
        });

        archive.pipe(stream);
        files.forEach(file => {
            archive.file(file[0], { name: file[1] });
        });
        archive.finalize();
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

function _fileExists(path) {
    return new Promise(function (resolve, reject) {
        return resolve(fs.existsSync(path));
    })
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

function _copyFile(source, dest) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(source)) {
            fs.copyFile(source, dest, (err) => {
                if (err) return reject(err);
                console.log(source + 'was copied to ' + dest);
                return resolve();
            });
        } else {
            return reject('Source file doesnt exist');
        }
    })
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
                addFileInTabOfName(element, tmp).then(async (response) => {
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
                            var groups = tabOfNameToGroups(new_tabOfName);
                            await saveIndexJson(save_path, groups);
                            resolve(new_tabOfName);
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

async function _getFromSwift(path, slug, target) {
    let openrc = 'cd ~ && source openrc.sh';
    let swift = 'swift download ' + slug
        + ' -D ' + path
        + ' --skip-identical > /dev/null';

    if (target !== 'all') {
        swift += ' -p ' + target;
    }
    let cmd = openrc + ' && ' + swift;
    console.log('downloading...');
    console.log(cmd);

    return exec(cmd, { shell: '/bin/bash', maxBuffer: 1024 * 4096 })
        .then(() => 'done')
        .catch((err) => {
            console.log('Error exec !: ' + err);
            throw err;
        });
}

async function _sendToSwift(path, slug, remote) {
    let openrc = 'cd ~ && source openrc.sh';
    let swift = 'swift upload ' + slug
        + ' ' + path
        + ' --skip-identical > /dev/null';

    if(remote !== undefined) {
        swift += ' --object-name ' + remote;
    }

    let cmd = openrc + ' && ' + swift;
    return exec(cmd, { shell: '/bin/bash', maxBuffer: 1024 * 4096 })
        .then(() => 'done')
        .catch((err) => {
            console.log('Error exec !: ' + err);
            throw err;
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
                    console.error('my repository already exists at ' + path);
                } else {
                    return reject(err);
                }
            }
            return resolve('ok');
        });
    });
}

function _createArbo(path, server_name, safe_folder, dirt_folder, save_folder, download_folder) {
    return new Promise(function (resolve, reject) {
        _createDir(path).then(() => {
            _createDir(path + server_name).then(() => {
                _createDir(path + server_name + safe_folder).then(() => {
                    _createDir(path + server_name + dirt_folder).then(() => {
                        _createDir(path + server_name + save_folder).then(() => {
                            _createDir(path + server_name + download_folder).then(() => {
                                return resolve('done');
                            }, (err) => {
                                console.log('Error creating download_folder !: ' + err);
                                return reject(err);
                            });
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

function _moveDir(source, destination) {
    return new Promise(function (resolve, reject) {
        fsDir.move(source, destination, function (err) {
            if (err) {
                console.log('An error occured while moving the folder.')
                return reject(err);
            }
            console.log(source + ' folder has been succefully moved in ' + destination);
            return resolve("ok");
        });
    })

}

function _archive_traitement(dest_path, source_path, archive_folder, safe_folder) {
    return new Promise(function (resolve, reject) {
        _desarchived(dest_path + archive_folder, source_path).then((response) => {
            console.log('desachived done');
            _checkFiles(dest_path + archive_folder).then((archive_name) => {
                console.log('check done');
                _copyDir(dest_path + archive_folder + archive_name[0], dest_path + safe_folder).then((response) => {
                    console.log('copyDir done');
                    _removeDir(dest_path + archive_folder).then(() => {
                        console.log('removeDir done');
                        _unlinkSync(source_path).then((response) => {
                            console.log('unlink done');
                            _checkFiles(dest_path + safe_folder).then((files) => {
                                console.log('checkFiles done');
                                console.log('archive traitement done');
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
function _archive_complete_traitement(dest_path, safe_folder, slug) {
    return new Promise(function (resolve, reject) {
        var fileProcessed = 0;
        _checkFiles(dest_path + safe_folder + repository).then((files) => {
            console.log('checkFiles done');
            if (files === undefined || files === [] || files.length === 0) {
                return reject('no correct repository found, please update an archive with the correct format : repository + sync');
            } else {
                files.forEach((element, index, array) => {
                    global_functions.asyncFunction(element, () => {
                        _copyDir(dest_path + safe_folder + repository + '/' + element, dest_path + safe_folder + element).then((response) => {
                            console.log('copyDir ' + fileProcessed + ' done');
                            fileProcessed++;
                            if (fileProcessed === array.length) {
                                console.log('checkFiles done');
                                // return resolve('ok');
                                _sendToSwift(dest_path + safe_folder + repository, slug, repository).then(() => {
                                    console.log('repository send');
                                    _sendToSwift(dest_path + safe_folder + sync, slug, sync).then(() => {
                                        console.log('sync send');
                                        _removeDir(dest_path + safe_folder + repository).then(() => {
                                            _removeDir(dest_path + safe_folder + sync).then(() => {
                                                return resolve('ok');
                                            }, (err) => {
                                                console.log('Error removeDir sync !: ' + err);
                                                return reject(err);
                                            });
                                        }, (err) => {
                                            console.log('Error removeDir repo !: ' + err);
                                            return reject(err);
                                        });
                                    }, (err) => {
                                        console.log('Error send repository to swift !: ' + err);
                                        return reject(err);
                                    });
                                }, (err) => {
                                    console.log('Error send sync to swift !: ' + err);
                                    return reject(err);
                                });

                            }
                        }, (err) => {
                            console.log('Error copy dir !: ' + err);
                            return reject(err);
                        });
                    });
                })
            }
        }, (err) => {
            console.log('Error checkfiles !: ' + err);
            return reject(err);
        });
    })
}

var upload_functions = {
    read,
    desarchived: _desarchived,
    checkFiles: _checkFiles,
    unlinkSync: _unlinkSync,
    download_from_url: _download_from_url,
    delete_useless_files: _delete_useless_files,
    create_new_tabOfName: _create_new_tabOfName,
    create_indexJSON: _create_indexJSON,
    sendToSwift: _sendToSwift,
    getFromSwift: _getFromSwift,
    createArchive,
    createArchiveFromDirectory,
    removeDir: _removeDir,
    renameDir: _renameDir,
    createArbo: _createArbo,
    copyFile: _copyFile,
    copyDir: _copyDir,
    moveDir: _moveDir,
    fileExists: _fileExists,
    load_tabOfName: _load_tabOfName,
    archive_traitement: _archive_traitement,
    archive_complete_traitement: _archive_complete_traitement,
    createDir: _createDir,
    parse_url: function (file_url) {
        return url.parse(file_url).host;
    },
    saveIndexJson,
    loadIndexJson,
    tabOfNameToGroups,
};

module.exports = upload_functions;
