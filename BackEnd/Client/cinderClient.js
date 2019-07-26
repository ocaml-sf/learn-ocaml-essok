var openstack = require('pkgcloud').providers.openstack;

var cinderClient = openstack.blockstorage.createClient({
    provider: 'openstack',
    username: 'sF37vT4pNz2n',
    password: '9CeaNjTUBa9Yb6SCy6XxA7xFMHmc9ZZh',
    authUrl: 'https://auth.cloud.ovh.net/',
    region: 'GRA5'
});

module.exports = cinderClient;
