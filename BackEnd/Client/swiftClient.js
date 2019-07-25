var openstack = require('pkgcloud').providers.openstack;

var swiftClient = openstack.storage.createClient({
    provider: 'openstack', // required
    username: 'sF37vT4pNz2n', // required
    password: '9CeaNjTUBa9Yb6SCy6XxA7xFMHmc9ZZh', // required
    authUrl: 'https://auth.cloud.ovh.net/',
    region: 'GRA5'
});

module.exports = swiftClient;
