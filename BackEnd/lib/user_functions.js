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

var user_functions = {
    createNamespace: function () {
        return _createNamespace();
    },
    readNamespace: function () {
        return _readNamespace();
    },
}

module.exports = user_functions;
