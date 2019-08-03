var openstack = require('pkgcloud');
var OS = require('./OS');

var swiftClient = openstack.storage.createClient({
    provider: OS.provider,
    username: OS.username,
    password: OS.password,
    authUrl: OS.authUrl,
    region: OS.region
});

module.exports = swiftClient;
