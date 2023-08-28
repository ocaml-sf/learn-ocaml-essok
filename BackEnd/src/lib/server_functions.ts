import * as k8s from '@kubernetes/client-node';
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApiDeploy = kc.makeApiClient(k8s.AppsV1Api);
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApiIngress = kc.makeApiClient(k8s.NetworkingV1Api);

k8sApiIngress.defaultHeaders = {
  'Content-Type': 'application/strategic-merge-patch+json',
  ...k8sApiIngress.defaultHeaders,
};

import env from 'env'
import * as global_functions from './global_functions';

const podLabelPrefix = 'app=';
const intervalTime = 5000;

export async function createNamespacedDeployment(deployment : any,
  namespace : string) {
  return k8sApiDeploy.createNamespacedDeployment(namespace, deployment);
}

export async function readNamespacedDeployment(slug : string,
  namespace : string) {
  return k8sApiDeploy.readNamespacedDeployment(slug, namespace);
};

/**
 * Return a promise with the list of pods found
 * an empty list mean no pods found
 */
export async function listNamespacedPod(slug : string, namespace : string) {
  return k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined,
    undefined, podLabelPrefix + slug)
    .then(res => res.body.items);
}

/**
 * Find the first pod in the list of pods found
 * if the list is empty, return an rejected promise
 */
export async function readNamespacedPod(slug : string, namespace : string) {
  return listNamespacedPod(slug, namespace)
    .then((items : k8s.V1Pod[]) => {
      if (items.length < 1)
        throw new Error('Pod not found');
      return items[0];
    });
}

export async function readNamespacedPodLog(slug : string, namespace : string) {
  return readNamespacedPod(slug, namespace)
    .then(pod => pod.metadata!.name!)
    .then(name => k8sApi.readNamespacedPodLog(name, namespace))
    .then(res => res.body);
}

export async function tryGetTeacherToken(slug : string, namespace : string) {
  return readNamespacedPodLog(slug, namespace)
    .then(log => global_functions.tryAllFindTeacherToken(log));
}

export async function catchTeacherToken(slug : string, namespace : string) {
  async function watchCatchTeacherToken() {
    let timedWatchCatch =
        () => global_functions.timedRun(watchCatchTeacherToken, intervalTime);

    return tryGetTeacherToken(slug, namespace)
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

export async function createNamespacedService(service : any,
  namespace : string) {
  return k8sApi.createNamespacedService(namespace, service);
};

async function patchNamespacedIngress(spec : any, namespace : string) {
  return k8sApiIngress.patchNamespacedIngress('learn-ocaml', namespace,
    { spec });
};

export async function createNamespacedIngress(rule : any, namespace : string) {
  return new Promise(function (resolve, reject) {
    k8sApiIngress.readNamespacedIngress('learn-ocaml', namespace, 'true')
      .then((response) => {
        const spec = response.body!.spec!;
          spec.rules!.push(rule);
          return resolve(patchNamespacedIngress(spec, namespace));
      })
      .catch((err) => {
        console.log('Error!: ' + JSON.stringify(err));
        return reject(err);
      });
  });
};

function createObjectDeployment(slug : string) {
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
              value: env.OS_AUTH_URL
            },
            {
              name: 'OS_USER_DOMAIN_NAME',
              value: env.OS_USER_DOMAIN_NAME
            },
            {
              name: 'OS_PROJECT_DOMAIN_NAME',
              value: env.OS_PROJECT_DOMAIN_NAME
            },
            {
              name: 'OS_USERNAME',
              value: env.OS_USERNAME
            },
            {
              name: 'OS_PASSWORD',
              value: env.OS_PASSWORD
            },
            {
              name: 'OS_TENANT_ID',
              value: env.OS_TENANT_ID
            },
            {
              name: 'OS_TENANT_NAME',
              value: env.OS_TENANT_NAME
            },
            {
              name: 'OS_REGION_NAME',
              value: env.OS_REGION_NAME
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

function createObjectService(slug : string) {
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

export function createObjectRule(slug : string, username : string) {
  return {
    // TODO: remove hard coded URL
    host: slug + "-" + username + ".learn-ocaml.org",
    http: {
      paths: [{
        path: "/",
        pathType: "Prefix",
        backend: {
          service: {
            name: slug,
            port: {
              number: 80
            }
          }
        }
      }]
    }
  }
}

export async function createkubelink(slug : string, username : string,
  namespace : string) {
  const deployment = createObjectDeployment(slug);
  const service = createObjectService(slug);
  const rule = createObjectRule(slug, username);

  await createNamespacedDeployment(deployment, namespace);
  await createNamespacedService(service, namespace);
  await createNamespacedIngress(rule, namespace);

  console.log('kubelink created');
  return 'done';
};

function removeIngressFile(rules : any, slug : string) {
  for (let index = 0; index < rules.length; index++) {
    if (rules[index].http.paths[0].backend.serviceName === slug) {
      rules.splice(index, 1);
      return 'done';
    } else if (index === rules.length - 1) {
      return 'already deleted';
    }
  }
}

export function deleteNamespacedIngress(slug : string, namespace : string) {
  return k8sApiIngress.readNamespacedIngress('learn-ocaml', namespace, 'true')
    .then(async (response) => {
      const spec = response!.body!.spec!;
      console.log('Ingress read');
      console.log('rule find : ' + spec.rules!);
      removeIngressFile(spec.rules!, slug);
      console.log('Ingress removed');
      await patchNamespacedIngress(spec, namespace)
        .then(() => console.log('Ingress patched'));
      return 'done';
    });
};

async function deleteNamespacedService(slug : string, namespace : string) {
  await k8sApi.readNamespacedService(slug, namespace);
  return k8sApi.deleteNamespacedService(slug, namespace);
};

async function deleteNamespacedDeployment(slug : string, namespace : string,
  waitPodDie = true) {
  async function watchPodDie() {
    let timedWatchRun =
            () => global_functions.timedRun(watchPodDie, intervalTime);
    return readNamespacedPod(slug, namespace)
      .then(_ => timedWatchRun())
      .catch(_ => true);
  }

  return k8sApiDeploy.deleteNamespacedDeployment(slug, namespace)
    .then(_ => (waitPodDie) ? watchPodDie() : true)
    .catch(_ => false);
};

export async function removekubelink(slug : string, namespace : string) {
  await deleteNamespacedIngress(slug, namespace)
    .then(() => console.log('ingress removed'))
    .catch(() => console.error('ingress error, ignoring...'));
  await deleteNamespacedService(slug, namespace)
    .then(() => console.log('service removed'))
    .catch(() => console.error('service error, ignoring...'));
  await deleteNamespacedDeployment(slug, namespace)
    .then(() => console.log('deployment removed'))
    .catch(() => console.error('deployment error, ignoring...'));
  return 'done';
}
