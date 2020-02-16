var openstack = require('pkgcloud');
var OS = require('../configs/OS');

var swiftClient = openstack.storage.createClient({
    provider: OS.provider,
    keystoneAuthVersion: 'v' + OS.identityApiVersion,
    username: OS.username,
    password: OS.password,
    authUrl: OS.authUrl,
    domainName: OS.domainName,
    region: OS.region
});

module.exports = swiftClient;
