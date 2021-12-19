const fs = require('fs');
const fsDir = require('fs-extra');
const unzipper = require('unzipper');
const url = require('url');
const child_process = require('child_process');
const rimraf = require("rimraf");
const swiftClient = require('../clients/swiftClient');
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

export const read = require('fs-readdir-recursive');

/**
 * Workaround to convert a tabOfName (a dumb structure of matrix)
 * the dumb structure is like [ [ "g1", "ex1", "ex2", ...], [ "g2", "ex3", ... ] ]
 * to a standart list of groups
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
export function tabOfNameToGroups(tabOfName : string[][]) {
  return tabOfName.map(group => {
    return { title: group[0], exercises: group.slice(1) };
  });
}

/**
 * Load a index.json file to extract the list of groups
 * return a promise with the list of groups
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
export async function loadIndexJson(dirPath : string) {
  const filePath = path.join(dirPath, defaultIndexJsonFilename);

  return fsPromises.readFile(filePath)
    .then((buffer : string) => JSON.parse(buffer))
    .then((indexObject : any) => Object.values(indexObject.groups));
}

/**
 * Save the index.json from a list of groups object
 * a group has a structure like { title: "g1", exercises: ["ex1", "ex2", ...] }
 */
export async function saveIndexJson(dirPath : any, groups : any) {
  const indexObject = JSON.parse(JSON.stringify(defaultIndexObj));
  const filePath = path.join(dirPath, defaultIndexJsonFilename);

  for (let i = 0; i < groups.length; i++) {
    indexObject.groups[`${groupPrefix}${i}`] = groups[i];
  }
  return Promise.resolve(JSON.stringify(indexObject, null, 4))
    .then(buffer => fsPromises.writeFile(filePath, buffer));
}

function create_IndexJSON_header() {
  return new Promise(function (resolve, reject) {
    return resolve('{ "learnocaml_version": "1",\n  "groups":\n  {\n');
  });
}

function create_IndexJSON_body(tabOfName : any) {
  return new Promise(resolve => {
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
  return new Promise(resolve => {
    return resolve('} }');
  });
}

function addFileInTabOfName(element : any, tmp : any) {
  return new Promise(resolve => {
    var new_group = [];
    for (let i = 0; i < element.length; i++) {
      if (i === 0) {
        new_group.push(element[i].replace(separator, new_separator));
      }
      else {
        if (tmp.includes(element[i])) {
          //console.log(tmp + ' contains : ' + element[i] + ' so it will be push in ' + new_group);
          new_group.push(element[i].replace(separator, new_separator));
          //console.log('new_group : ' + new_group);
        }
        if (i == element.length - 1) {
          //console.log('finally new_group : ' + new_group);
          return resolve(new_group);
        }
      }
    }
  });
}

function file_to_delete(path : string, element : any,
  useless : any, tabOfName : any) {
  return new Promise(function (resolve, reject) {
    fs.stat(path + element, function (err : any, stat : any) {
      if (err) return reject(err);
      if (stat.isFile()) {
        console.log(path + element + ' is a file, so it will be deleted');
        fs.unlink(path + element, function (err : any) {
          if (err) return reject(err);
          return resolve(undefined);
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
              return resolve(undefined);
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

function deleteDir(tab_of_dir : any) {
  return new Promise(function (resolve, reject) {
    var tmp = tab_of_dir.length;
    console.log('tmp.length : ' + tmp);
    if (tmp === 0) {
      console.log('no more file to delete');
      return resolve(undefined);
    }
    for (let i = 0; i < tab_of_dir.length; i++) {
      rimraf(tab_of_dir[i], function (err : any) {
        if (err) return reject(err);
        console.log('file deleted in tmp');
        tmp--;
        console.log('tmp.length : ' + tmp);
        if (tmp === 0) {
          console.log('no more file to delete');
          return resolve(undefined);
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
export async function createArchiveFromDirectory(source : string, dest : string,
  format : any, archive_name : any) {
  var files = read(source)
    .map((file : string) =>
      [path.join(source, file), path.join(dest, file)]);
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
export async function createArchive(files : any, format : any,
  archive_name = 'archive') {
  const stream = fs.createWriteStream(archive_name + '.' + format);
  const archive = archiver(format, {});

  await new Promise(resolve => {
    stream.on('close', function () {
      console.log('archive ' + archive + ' created');
      resolve(undefined);
    });

    archive.pipe(stream);
    files.forEach((file : any) => {
      archive.file(file[0], { name: file[1] });
    });
    archive.finalize();
  });
}

export function desarchived(dest_path : any, source_path : any) {
  return new Promise(function (resolve, reject) {

    fs.createReadStream(source_path).pipe(unzipper.Extract({ path: dest_path }))
      .on('close', function (err : any) {
        if (err) return reject(err);
        return resolve(dest_path);
      })
      .on('error', function (err : any) {
        return reject(err);
      });
  });
}

export function checkFiles(path : string) {
  return new Promise(function (resolve, reject) {
    if (fs.existsSync(path)) {
      fs.readdir(path, function (err : any, files : any) {
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

export function fileExists(path : string) {
  return Promise.resolve(fs.existsSync(path));
}

export function unlinkSync(path : string) {
  return new Promise(function (resolve, reject) {
    if (fs.existsSync(path)) {
      fs.unlink(path, function (err : any) {
        if (err) return reject(err);
        return resolve('deleted');
      })
    } else {
      return resolve('deleted');
    }
  });
}

export function copyFile(source : any, dest : any) {
  return new Promise(function (resolve, reject) {
    if (fs.existsSync(source)) {
      fs.copyFile(source, dest, (err : any) => {
        if (err) return reject(err);
        console.log(source + 'was copied to ' + dest);
        return resolve(undefined);
      });
    } else {
      return reject('Source file doesnt exist');
    }
  })
}

export function download_from_url(file_url : any, dest_path : any) {
  return new Promise(function (resolve, reject) {

    var file_name = url.parse(file_url).pathname.split('/').pop();
    var wget = 'wget -P ' + dest_path + ' ' + file_url;

    child_process.exec(wget, (err : any) => {
      if (err) return reject(err);
      return resolve(dest_path + file_name);
    });
  });
}

export function delete_useless_files(useless : any, path : any,
  tabOfName : any, files : any) {
  return new Promise(function (resolve, reject) {
    if (useless === [] || useless === undefined || useless === null) {
      return resolve('nothing to delete');
    }
    //console.log('tabOfName before filter : ' + tabOfName);
    tabOfName = tabOfName.filter((group : any) => group.length >= 2);
    //console.log('tabOfName after filter : ' + tabOfName);

    var tmp : any = [];
    var itemsProcessed = 0;
    files.forEach((element : any, index : any, array : any) => {
      global_functions.asyncFunction(element, () => {
        file_to_delete(path, element, useless, tabOfName)
          .then((response) => {
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

export function create_new_tabOfName(save_path : any, path : any, tabOfName : any) {
  return new Promise(function (resolve, reject) {

    var nameProcessed = 0;
    var tmp = fs.readdirSync(path);
    var new_tabOfName : any = [[]];

    tabOfName.forEach((element : any, index : any, array : any) => {
      global_functions.asyncFunction(element, () => {
        addFileInTabOfName(element, tmp).then(async (response) => {
          if (response) {
            //console.log('new group in new_tab_of_name : ' + response);
            new_tabOfName.push(response);
            //console.log('new_tab_of_name : ' + new_tabOfName);
          }
          nameProcessed++;
          if (nameProcessed === array.length) {
            //console.log('new_tabOfName before filter : ' + new_tabOfName);
            new_tabOfName = new_tabOfName.filter((group : any) => group.length >= 2);
            //console.log('new_tabOfName after filter : ' + new_tabOfName);
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

function _save_tabOfName(save_path : any, tabOfName : any) {
  return new Promise(function (resolve, reject) {
    var line = '';
    tabOfName.forEach((tab : any) => {
      tab.forEach((element : any) => {
        line += element + separator;
      });
      line += '\n';
    });
    fs.writeFile(save_path + saveFile, line, function (err : any) {
      if (err) {
        console.log('error in saving tabofname');
        return reject(err);
      }
      console.log('index_saved created');
      return resolve('ok');
    })
  })
}

export function load_tabOfName(save_path : any) {
  return new Promise(function (resolve, reject) {
    fs.readFile(save_path + saveFile, 'utf8', (err : any, data : any) => {
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

export function create_indexJSON(path : any, tabOfName : any) {
  return new Promise(function (resolve, reject) {
    create_IndexJSON_header().then((header : any) => {
      //console.log('header created : \n' + header);
      create_IndexJSON_body(tabOfName).then((body : any) => {
        //console.log('body created : \n' + body);
        create_IndexJSON_footer().then((footer : any) => {
          //console.log('footer created : \n' + footer);
          fs.writeFile(path, header + body + footer, (err : any) => {
            if (err) return reject(err);
            console.log('index.json : ' + header + body + footer);
            return resolve(path + 'exercises/index.json');
          });
        })
      })
    })
  });
}

export async function getFromSwift(path : any, slug : any, target : any) {
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
    .catch((err : any) => {
      console.log('Error exec !: ' + err);
      throw err;
    });
}

export async function sendToSwift(path : any, slug : any, remote : any) {
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
    .catch((err : any) => {
      console.log('Error exec !: ' + err);
      throw err;
    });
}

export function removeDir(path : any) {
  return new Promise(function (resolve, reject) {
    if (fs.existsSync(path)) {
      rimraf(path, function (err : any) {
        if (err) return reject(err);
        return resolve('removed');
      });
    }
    else { return resolve('removed'); }
  });
}

export function renameDir(oldPath : any, newPath : any,
  unknown : any, remove_if_not_empty : any) {
  return new Promise(function (resolve, reject) {
    if (unknown) {
      fs.readdir(oldPath, function (err : any, files : any) {
        if (err) return reject(err);
        else {
          fs.rename(oldPath + files[0], newPath, (err : any) => {
            if (err) return reject(err);
            return resolve('renamed');
          })
        }
      })
    } else {
      fs.rename(oldPath, newPath, function (err : any) {
        if (err) {
          return reject(err);
        }
        return resolve('renamed');
      })
    }

  })
}

export function createDir(path : any) {
  return new Promise(function (resolve, reject) {
    fs.mkdir(path, function (err : any) {
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

export function createArbo(path : any, server_name : any,
  safe_folder : any, dirt_folder : any, save_folder : any,
  download_folder : any) {
  return new Promise(function (resolve, reject) {
    createDir(path).then(() => {
      createDir(path + server_name).then(() => {
        createDir(path + server_name + safe_folder).then(() => {
          createDir(path + server_name + dirt_folder).then(() => {
            createDir(path + server_name + save_folder).then(() => {
              createDir(path + server_name + download_folder).then(() => {
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

export function copyDir(source : any, destination : any) {
  return new Promise(function (resolve, reject) {
    fsDir.copy(source, destination, (err : any) => {
      if (err) {
        console.log('An error occured while copying the folder.')
        return reject(err);
      }
      console.log(source + ' folder has been succefully copied in ' + destination);
      return resolve("ok");
    });
  })
}

export function moveDir(source : any, destination : any) {
  return new Promise(function (resolve, reject) {
    fsDir.move(source, destination, function (err : any) {
      if (err) {
        console.log('An error occured while moving the folder.')
        return reject(err);
      }
      console.log(source + ' folder has been succefully moved in ' + destination);
      return resolve("ok");
    });
  })

}

export function archive_traitement(dest_path : any, source_path : any,
  archive_folder : any, safe_folder : any,
  link_github = '') {
  return new Promise(function (resolve, reject) {
    desarchived(dest_path + archive_folder, source_path).then((response) => {
      console.log('desachived done');
      checkFiles(dest_path + archive_folder).then((archive_name : any) => {
        console.log('check done');
        copyDir(dest_path + archive_folder + archive_name[0] + link_github, dest_path + safe_folder)
          .then((response : any) => {
            console.log('copyDir done');
            removeDir(dest_path + archive_folder).then(() => {
              console.log('removeDir done');
              unlinkSync(source_path).then((response) => {
                console.log('unlink done');
                checkFiles(dest_path + safe_folder).then((files) => {
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

export function archive_complete_traitement(dest_path : any, safe_folder : any,
  slug : any) {
  return new Promise(function (resolve, reject) {
    var fileProcessed = 0;
    checkFiles(dest_path + safe_folder + repository)
      .then((files : any) => {
        console.log('checkFiles done');
        if (files === undefined || files === [] || files.length === 0) {
          return reject('no correct repository found, please update an archive with the correct format : repository + sync');
        } else {
          files.forEach((element : any, index : any, array : any) => {
            global_functions.asyncFunction(element, () => {
              copyDir(dest_path + safe_folder + repository + '/' + element, dest_path + safe_folder + element).then((response : any) => {
                console.log('copyDir ' + fileProcessed + ' done');
                fileProcessed++;
                if (fileProcessed === array.length) {
                  console.log('checkFiles done');
                  // return resolve('ok');
                  sendToSwift(dest_path + safe_folder + repository, slug, repository).then(() => {
                    console.log('repository send');
                    sendToSwift(dest_path + safe_folder + sync, slug, sync).then(() => {
                      console.log('sync send');
                      removeDir(dest_path + safe_folder + repository).then(() => {
                        removeDir(dest_path + safe_folder + sync).then(() => {
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

export function parse_url(file_url : any) {
  return url.parse(file_url).host;
}

/*
var upload_functions = {
    unlinkSync: unlinkSync,
    download_from_url: download_from_url,
    delete_useless_files: delete_useless_files,
    create_new_tabOfName: create_new_tabOfName,
    create_indexJSON: create_indexJSON,
    sendToSwift: sendToSwift,
    getFromSwift: getFromSwift,
    createArchive,
    createArchiveFromDirectory,
    removeDir: removeDir,
    renameDir: renameDir,
    createArbo: createArbo,
    copyFile: copyFile,
    copyDir: copyDir,
    moveDir: moveDir,
    fileExists: fileExists,
    load_tabOfName: load_tabOfName,
    archive_traitement: archive_traitement,
    archive_complete_traitement: archive_complete_traitement,
    createDir: createDir,
    parse_url: function (file_url : any) {
        return url.parse(file_url).host;
    },
    saveIndexJson,
    loadIndexJson,
    tabOfNameToGroups,
};

module.exports = upload_functions;
*/
