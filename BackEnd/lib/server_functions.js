const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApiDeploy = kc.makeApiClient(k8s.AppsV1Api);
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiIngress = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
const k8sApiJobs = kc.makeApiClient(k8s.BatchV1Api);

k8sApiIngress.defaultHeaders = {
    'Content-Type': 'application/strategic-merge-patch+json',
    ...k8sApiIngress.defaultHeaders,
};
var swiftClient = require('../Client/swiftClient');
var OS = require('../Client/OS');
const global_functions = require('./global_functions');

function _createNamespacedDeployment(deployment, namespace) {
    return k8sApiDeploy.createNamespacedDeployment(namespace, deployment);
}

function _readNamespacedDeployment(slug, namespace) {
    return k8sApiDeploy.readNamespacedDeployment(slug, namespace);
};

function _createNamespacedService(service, namespace) {
    return k8sApi.createNamespacedService(namespace, service);
};

function _patchNamespacedIngress(_spec, namespace) {
    return k8sApiIngress.patchNamespacedIngress('learn-ocaml', namespace, { spec: _spec });
};

function _createNamespacedIngress(rule, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApiIngress.readNamespacedIngress('learn-ocaml', namespace, 'true').then(
            (response) => {
                response.body.spec.rules.push(rule);
                return resolve(_patchNamespacedIngress(response.body.spec, namespace));
            },
            (err) => {
                console.log('Error!: ' + JSON.stringify(err));
                return reject(err);
            },
        );
    });
};

function _createObjectDeployment(slug, volume) {
    return {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: slug,
            labels: {
                app: slug
            }
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: slug
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: slug
                    }
                },
                spec: {
                    containers: [
                        {
                            name: 'learn-ocaml',
                            image: 'ocamlsf/learn-ocaml:latest',
                            ports: [
                                {
                                    containerPort: 8080
                                }
                            ],
                            volumeMounts: [
                                {
                                    name: slug,
                                    mountPath: '/repository/',
                                    subPath: 'repository',
                                },
                                {
                                    name: slug,
                                    mountPath: '/sync/',
                                    subPath: 'sync',
                                }
                            ]
                        }
                    ],
                    securityContext: {
                        fsGroup: 1000
                    },
                    volumes: [
                        {
                            name: slug,
                            cinder: {
                                volumeID: volume,
                                fsType: 'ext4'
                            }
                        }
                    ]
                }
            }
        }
    }
}

function _createObjectService(slug) {
    return {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: slug,
            labels: {
                app: slug
            }
        },
        spec: {
            type: 'ClusterIP',
            selector: {
                app: slug
            },
            ports: [
                {
                    name: 'http',
                    port: 80,
                    targetPort: 8080
                }
            ]
        }
    }
}

function _createObjectRule(slug, username) {
    return {
        host: username + '.' + slug + '.learnocaml.site', //.org
        http: {
            paths: [{
                backend: {
                    serviceName: slug,
                    servicePort: 80
                }
            }]
        }
    }
}

function _createObjectPVC(slug, namespace) {
    return {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
            name: slug,
            namespace: namespace
        },
        spec: {
            accessModes: [
                'ReadWriteOnce'
            ],
            resources: {
                requests: {
                    storage: '1Gi'
                }
            },
            storageClassName: 'cinder-classic',
            volumeMode: 'Filesystem'
        }
    };
}
function _createObjectJob(slug, backupType, backupCommand, volume) {
    return {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: backupType + '-' + slug
        },
        spec: {
            ttlSecondsAfterFinished: 0,
            template: {
                spec: {
                    containers: [
                        {
                            image: 'python',
                            name: slug,
                            env: [
                                {
                                    name: 'OS_AUTH_URL',
                                    value: OS.authUrl
                                },
                                {
                                    name: 'OS_IDENTIY_API_VERSION',
                                    value: OS.identityApiVersion
                                },
                                {
                                    name: 'OS_USERNAME',
                                    value: OS.username
                                },
                                {
                                    name: 'OS_PASSWORD',
                                    value: OS.password
                                },
                                {
                                    name: 'OS_TENANT_ID',
                                    value: OS.tenantID
                                },
                                {
                                    name: 'OS_REGION_NAME',
                                    value: OS.region
                                }
                            ],
                            command: [
                                '/bin/sh'
                            ],
                            args: [
                                '-c',
                                backupCommand
                            ],
                            volumeMounts: [
                                {
                                    name: slug,
                                    mountPath: '/volume/'
                                }
                            ]
                        },
                    ],
                    restartPolicy: 'OnFailure',
                    securityContext: {
                        fsGroup: 1000
                    },
                    volumes: [
                        {
                            name: slug,
                            cinder: {
                                volumeID: volume,
                                fsType: 'ext4'
                            }
                        }
                    ]
                }
            }
        }
    }
}

function _createObjectContainer(slug) {
    return {
        name: slug,
        metadata: {}
    }
}

function _createkubelink(volume, slug, username, namespace) {
    return new Promise(function (resolve, reject) {
        var service = _createObjectService(slug);
        var rule = _createObjectRule(slug, username);
        var deployment = _createObjectDeployment(slug, volume);
        _createNamespacedDeployment(deployment, namespace).then((response) => {
            _createNamespacedService(service, namespace).then((response) => {
                _createNamespacedIngress(rule, namespace).then((response) => {
                    console.log('kubelink created');
                    return resolve('done');
                }, (err) => {
                    return reject(err);
                });
            }, (err) => {
                return reject(err);
            });
        },
            (err) => {
                return reject(err);
            });
    });
};

function _createSwiftContainer(slug) {
    return new Promise(function (resolve, reject) {
        swiftClient.createContainer(_createObjectContainer(slug), function (err, container) {
            if (err) return reject(err);
            return resolve(container);
        });
    });
};

function _getSwiftContainer(slug) {
    return new Promise(function (resolve, reject) {
        swiftClient.getContainers(function (err, containers) {
            if (err) return reject(err);
            else {
                for (let i = 0; i < containers.length; i++) {
                    if (containers[i].name === slug) {
                        return resolve(containers[i]);
                    }
                    else {
                        if (i === containers.length - 1) {
                            return reject('not found');
                        }
                    }
                }
            }
        });
    });
};

function _destroySwiftContainer(slug) {
    return new Promise(function (resolve, reject) {
        _getSwiftContainer(slug).then(function (response) {
            swiftClient.destroyContainer(response, function (err, result) {
                if (err) return reject(err);
                return resolve(result);
            });
        }, (err) => {
            console.log('already deleted');
            return resolve('already deleted');
        });
    });
};

function _removeIngressFile(rules, slug) {
    return new Promise(function (resolve, reject) {

        for (let index = 0; index < rules.length; index++) {
            if (rules[index].http.paths[0].backend.serviceName === slug) {
                rules.splice(index, 1);
                return resolve('done');
            }
            else {
                if (index === rules.length - 1) {
                    return resolve('already deleted');
                }
            }
        }
    });
};

function _deleteNamespacedIngress(slug, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApiIngress.readNamespacedIngress('learn-ocaml', namespace, 'true').then(
            (response) => {
                var rules = response.body.spec.rules;
                console.log('Ingress read');
                console.log('rule find : ' + rules);
                _removeIngressFile(rules, slug).then(() => {
                    console.log('Ingress removed');
                    _patchNamespacedIngress(response.body.spec, namespace).then(() => {
                        console.log('Ingress patched');
                        return resolve('done');
                    }, (err) => {
                        return reject(err);
                    });
                }, (err) => {
                    return reject(err);
                });
            }, (err) => {
                return reject(err);
            });
    });
};

function _deleteNamespacedService(slug, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApi.readNamespacedService(slug, namespace).then((response) => {
            return resolve(k8sApi.deleteNamespacedService(slug, namespace));
        }, (err) => {
            console.log('Service doesnt exist');
            return resolve('Service doesnt exist');
        });
    });
};

function _deleteNamespacedDeployment(slug, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApiDeploy.readNamespacedDeployment(slug, namespace).then((response) => {
            return resolve(k8sApiDeploy.deleteNamespacedDeployment(slug, namespace));
        }, (err) => {
            console.log('deployment doesnt exist');
            return resolve('deployment doesnt exist');
        });
    });
};

function _removekubelink(slug, namespace) {
    return new Promise(function (resolve, reject) {
        _deleteNamespacedIngress(slug, namespace).then((response) => {
            console.log('ingress removed');
            _deleteNamespacedService(slug, namespace).then((response) => {
                console.log('service removed');
                _deleteNamespacedDeployment(slug, namespace).then((response) => {
                    console.log('deployment removed');
                    return resolve('done');
                }, (err) => {
                    return reject(err);
                });
            }, (err) => {
                return reject(err);
            });
        }, (err) => {
            return reject(err);
        });
    });
};

function _deleteNamespacedPersistentVolumeClaim(slug, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApi.readNamespacedPersistentVolumeClaim(slug, namespace).then((response) => {
            return resolve(k8sApi.deleteNamespacedPersistentVolumeClaim(slug, namespace));
        }, (err) => {
            console.log('PVC doesnt exist');
            return resolve('PVC doesnt exist');
        });
    });
}

function _listPersistentVolume(slug) {
    return new Promise(function (resolve, reject) {
        k8sApi.listPersistentVolume().then((response) => {
            var itemsProcessed = 0;
            response.body.items.forEach((element, index, array) => {
                global_functions.asyncFunction(element, () => {
                    if (element.spec.claimRef.name === slug) {
                        console.log('volumeID found : ' + element.spec.cinder.volumeID);
                        return resolve(element.spec.cinder.volumeID);
                    }
                    itemsProcessed++;
                    if (itemsProcessed === array.length) {
                        console.log('volumeID not found');
                        return reject('volumeID not found');
                    }
                });
            });
        }, (err) => {
            console.log('Error!: ' + err);
            return reject(err);
        });
    });
};

function _backup(slug, backupType, backupCommand, volume, namespace) {
    return new Promise(function (resolve, reject) {
        var job = _createObjectJob(slug, backupType, backupCommand, volume);
        k8sApiJobs.createNamespacedJob(namespace, job).then((response) => {
            var jobInProgress = setInterval(function () {
                k8sApiJobs.listNamespacedJob(namespace).then((response) => {
                    response.body.items.forEach(item => {
                        if (item.metadata.name === backupType + "-" + slug) {
                            console.log('job found');
                            console.log('job succeeded : ' + item.status.succeeded);
                            if (item.status.succeeded !== undefined) {
                                console.log('job done');
                                clearInterval(jobInProgress);
                                k8sApiJobs.deleteNamespacedJob(backupType + '-' + slug, namespace).then((response) => {
                                    console.log('jobs deleted')
                                    return resolve('success');
                                }, (err) => {
                                    return reject(err);
                                });
                            }
                        }
                    });
                }, (err) => {
                    console.log(err);
                    return reject(err);
                });
            }, 5000);
        }, (err) => {
            console.log(err);
            return reject(err);
        });
    });
};

function _backupUpload(volume, slug, namespace) {
    var backupType = 'upload';
    var backupCommand = 'pip install --no-cache python-swiftclient python-keystoneclient;' +
        'swift download ' + slug + ' -D /volume/';
    console.log('asking for upload');
    return _backup(slug, backupType, backupCommand, volume, namespace);
};

function _backupDownload(volume, slug, namespace) {
    var backupType = 'download';
    var backupCommand = 'pip install --no-cache python-swiftclient python-keystoneclient;' +
        'rm -rf /volume/lost+found;' + 'swift upload ' + slug + ' /volume/ --object-name /';
    console.log('asking for download');
    return _backup(slug, backupType, backupCommand, volume, namespace);
};

function _createNamespacedPersistentVolumeClaim(slug, namespace) {
    var serverCreated = false;
    var pvc = _createObjectPVC(slug, namespace);
    return new Promise(function (resolve, reject) {
        k8sApi.createNamespacedPersistentVolumeClaim(namespace, pvc)
            .then((response) => {
                console.log('Volume ' + slug + ' claimed');
                var serverInCreation = setInterval(function () {
                    k8sApi.listNamespacedPersistentVolumeClaim(namespace).then((response) => {
                        response.body.items.forEach(element => {
                            if (element.metadata.name === slug) {
                                console.log('item found ' + element);
                                status = element.status.phase;
                                console.log('status found ' + status);
                                if (element.status.phase === 'Bound') {
                                    serverCreated = true;
                                    console.log('status bound found !');
                                    clearInterval(serverInCreation);
                                    return resolve('created');
                                }
                            }
                        });
                    });
                }, 3000);
            }, (err) => {
                // Actually the only error is 'Already Claimed' so it's temporary put to okay until a better error biding, that need some time, so to fix ...
                return resolve(err);
            });
    });
}

function _createPersistentVolumeAndLinkKube(slug, username, namespace) {
    return new Promise(function (resolve, reject) {
        var serverCreated = false;
        var pvc = _createObjectPVC(slug, namespace);
        _createNamespacedPersistentVolumeClaim(slug, namespace)
            .then((response) => {
                _listPersistentVolume(slug).then((volume) => {
                    _backupUpload(volume, slug, namespace).then((response) => {
                        console.log('backup ok');
                        _createkubelink(volume, slug, username, namespace).then((response) => {
                            console.log('server shut on');
                            return resolve(volume);
                        }, (err) => {
                            return reject(err);
                        });
                    }, (err) => {
                        //abort all
                        return reject(err);
                    });
                }, (err) => {
                    return reject(err);
                });
            });
    });
};

function _shut_off(slug, namespace, volume) {
    return new Promise(function (resolve, reject) {
        _removekubelink(slug, namespace).then((response) => {
            _backupDownload(volume, slug, namespace).then((response) => {
                _deleteNamespacedPersistentVolumeClaim(slug, namespace).then((response) => {
                    console.log('server shut off');
                    return resolve('done');
                }, (err) => {
                    return reject(err);
                });
            }, (err) => {
                return reject(err);
            });
        }, (err) => {
            return reject(err);
        });
    });
}

function _delete(slug, namespace) {
    return new Promise(function (resolve, reject) {
        _removekubelink(slug, namespace).then((response) => {
            console.log('kubelink removed');
            _deleteNamespacedPersistentVolumeClaim(slug, namespace).then((response) => {
                console.log('pvc removed');
                _destroySwiftContainer(slug).then((response) => {
                    console.log('swift container removed');
                    console.log('server deleted');
                    return resolve('done');
                }, (err) => {
                    console.log(err);
                    return reject(err);
                });
            }, (err) => {
                console.log(err);
                return reject(err);
            });
        }, (err) => {
            console.log(err);
            return reject(err);
        });
    });
}

var server_functions = {
    createNamespacedDeployment: function (deployment) {
        return _createNamespacedDeployment(deployment);
    },

    createSwiftContainer: function (slug) {
        return _createSwiftContainer(slug);
    },

    shut_on: function (slug, username, namespace) {
        return _createPersistentVolumeAndLinkKube(slug, username, namespace);
    },

    shut_off: function (slug, namespace, volume) {
        return _shut_off(slug, namespace, volume);
    },

    delete: function (slug, namespace) {
        return _delete(slug, namespace);
    },

}

module.exports = server_functions;
