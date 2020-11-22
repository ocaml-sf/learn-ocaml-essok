const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApiDeploy = kc.makeApiClient(k8s.AppsV1Api);
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiIngress = kc.makeApiClient(k8s.ExtensionsV1beta1Api);

k8sApiIngress.defaultHeaders = {
    'Content-Type': 'application/strategic-merge-patch+json',
    ...k8sApiIngress.defaultHeaders,
};
var swiftClient = require('../clients/swiftClient');
var OS = require('../configs/OS');

const global_functions = require('./global_functions');
const upload_functions = require('./upload_functions');
const podLabelPrefix = 'app=';
const intervalTime = 5000;

async function _createNamespacedDeployment(deployment, namespace) {
    return k8sApiDeploy.createNamespacedDeployment(namespace, deployment);
}

async function _readNamespacedDeployment(slug, namespace) {
    return k8sApiDeploy.readNamespacedDeployment(slug, namespace);
};

/**
 * Return a promise with the list of pods found
 * an empty list mean no pods found
 */
async function _listNamespacedPod(slug, namespace, verbose = false) {
    return k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined,
        undefined, podLabelPrefix + slug)
        .then(res => (verbose) ? res : res.body.items);
}

/**
 * Find the first pod in the list of pods found
 * if the list is empty, return an rejected promise
 */
async function _readNamespacedPod(slug, namespace) {
    return _listNamespacedPod(slug, namespace)
        .then(items => {
            if (items.length < 1)
                throw new Error('Pod not found');
            return items[0];
        });
}

async function _readNamespacedPodLog(slug, namespace, verbose = false) {
    return _readNamespacedPod(slug, namespace)
        .then(pod => pod.metadata.name)
        .then(name => k8sApi.readNamespacedPodLog(name, namespace))
        .then(res => (verbose) ? res : res.body);
}

async function _tryGetTeacherToken(slug, namespace) {
    return _readNamespacedPodLog(slug, namespace)
        .then(log => global_functions.tryFindTeacherToken(log));
}

async function _catchTeacherToken(slug, namespace) {
    async function watchCatchTeacherToken() {
        let timedWatchCatch = () => global_functions.timedRun(watchCatchTeacherToken, intervalTime);

        return _tryGetTeacherToken(slug, namespace)
            .catch(err => {
                if (err === global_functions.tokenObj.errorNotFound) {
                    console.log("Token not found, retrying...");
                    return timedWatchCatch();
                } else {
                    throw err;
                }
            });
    }

    return watchCatchTeacherToken();
}

async function _createNamespacedService(service, namespace) {
    return k8sApi.createNamespacedService(namespace, service);
};

async function _patchNamespacedIngress(_spec, namespace) {
    return k8sApiIngress.patchNamespacedIngress('learn-ocaml', namespace, { spec: _spec });
};

async function _createNamespacedIngress(rule, namespace) {
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

function _createObjectDeployment(slug) {
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
                    containers: [{
                        name: 'learn-ocaml',
                        image: 'ocamlsf/learnocaml-essok-dockerfile:latest',
                        ports: [{
                            containerPort: 8080
                        }],
                        env: [{
                            name: 'OS_AUTH_URL',
                            value: OS.authUrl
                        },
                        {
                            name: 'ST_AUTH_VERION',
                            value: OS.identityApiVersion
                        },
                        {
                            name: 'OS_USERNAME',
                            value: OS.username
                        },
                        {
                            name: 'OS_USER_DOMAIN_NAME',
                            value: OS.domainName
                        },
                        {
                            name: 'OS_PASSWORD',
                            value: OS.password
                        },
                        {
                            name: 'OS_PROJECT_NAME',
                            value: OS.projectName
                        },
                        {
                            name: 'OS_PROJECT_DOMAIN_NAME',
                            value: OS.domainName
                        },
                        {
                            name: 'OS_REGION_NAME',
                            value: OS.region
                        }
                        ],
                        args: [slug]
                    }],
                    terminationGracePeriodSeconds: 900
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
            ports: [{
                name: 'http',
                port: 80,
                targetPort: 8080
            }]
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

function _createObjectContainer(slug) {
    return {
        name: slug,
        metadata: {}
    }
}

function _createkubelink(slug, username, namespace) {
    return new Promise(function (resolve, reject) {
        var deployment = _createObjectDeployment(slug);
        var service = _createObjectService(slug);
        var rule = _createObjectRule(slug, username);
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
                    } else {
                        if (i === containers.length - 1) {
                            return reject('not found');
                        }
                    }
                }
            }
        });
    });
};

function _copySwiftContainerFile(containerSrc, containerDst, file) {
    return new Promise((resolve, reject) => {
        swiftClient.copy({
            sourceContainer: containerSrc,
            destinationContainer: containerDst,
            sourceFile: file,
            destinationFile: file
        }, (err, res) => {
            if (err !== null)
                reject(err);
            resolve(res);
        });
    });
}

function _copySwiftContainer(containerSrc, containerDst) {
    return new Promise((resolve, reject) => {
        swiftClient.getFiles(containerSrc, (err, files) => {
            if (err !== null)
                reject(err);
            files = files.map(file => _copySwiftContainerFile(containerSrc,
                containerDst,
                file));
            Promise.all(files).then(resolve, reject);
        });
    });
}

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
            } else {
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

async function _deleteNamespacedService(slug, namespace) {
    return new Promise(function (resolve, reject) {
        k8sApi.readNamespacedService(slug, namespace).then((response) => {
            return resolve(k8sApi.deleteNamespacedService(slug, namespace));
        }, (err) => {
            console.log('Service doesnt exist');
            return resolve('Service doesnt exist');
        });
    });
};

async function _deleteNamespacedDeployment(slug, namespace, waitPodDie = true) {
    async function watchPodDie() {
        let timedWatchRun = () => global_functions.timedRun(watchPodDie, intervalTime);
        return _readNamespacedPod(slug, namespace)
            .then(_ => timedWatchRun())
            .catch(_ => true);
    }

    return k8sApiDeploy.deleteNamespacedDeployment(slug, namespace)
        .then(_ => (waitPodDie) ? watchPodDie() : true)
        .catch(_ => false);
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

function _delete(slug, namespace, path) {
    return new Promise(function (resolve, reject) {
        _removekubelink(slug, namespace).then((response) => {
            console.log('kubelink removed');
            _destroySwiftContainer(slug).then((response) => {
                console.log('swift container removed');
                upload_functions.removeDir(path).then(_ => {
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
    createNamespacedDeployment: _createNamespacedDeployment,
    copySwiftContainer: _copySwiftContainer,
    createSwiftContainer: _createSwiftContainer,
    shut_on: _createkubelink,
    shut_off: _removekubelink,
    delete: _delete,
    readNamespacedPodLog: _readNamespacedPodLog,
    tryGetTeacherToken: _tryGetTeacherToken,
    catchTeacherToken: _catchTeacherToken
};

module.exports = server_functions;
