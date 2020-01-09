const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

function _createNamespace(namespace) {
    return k8sApi.createNamespace(namespace);
};

function _readNamespace(namespace) {
    return k8sApi.readNamespace(namespace);
};

function _createObjectNamespace(_name) {
    return namespace = {
        metadata: {
            name: _name,
        },
    };
}
var user_functions = {
    createNamespace: _createNamespace,
    readNamespace: _readNamespace,
    createObjectNamespace: _createObjectNamespace,
}

module.exports = user_functions;
