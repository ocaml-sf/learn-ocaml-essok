var openstack = require('pkgcloud');
import { OS } from '../configs/OS';

export const swiftClient = openstack.storage.createClient({
  provider: OS.provider,
  keystoneAuthVersion: 'v' + OS.identityApiVersion,
  username: OS.username,
  password: OS.password,
  authUrl: OS.authUrl,
  domainName: OS.domainName,
  region: OS.region
});
