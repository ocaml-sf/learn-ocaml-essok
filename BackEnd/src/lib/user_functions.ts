import * as k8s from '@kubernetes/client-node';
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

function _createNamespace(namespace : k8s.V1Namespace) {
  return k8sApi.createNamespace(namespace);
};

function _readNamespace(namespace : string) {
  return k8sApi.readNamespace(namespace);
};

function _createObjectNamespace(name : any) {
  return {
    metadata: {
      name,
    },
  };
}
var user_functions = {
  createNamespace: _createNamespace,
  readNamespace: _readNamespace,
  createObjectNamespace: _createObjectNamespace,
}

module.exports = user_functions;
