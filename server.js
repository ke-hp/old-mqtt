// lib
const debug = require('debug')('mqtt:server');
require('dotenv').config();
const mosca = require('mosca');
const authorizer = require('./lib/authorizer');

const pubsubBackend = {
    type: 'redis',
    redis: require('redis'),
    host: process.env.MQTT_REDIS_HOST,
    port: process.env.MQTT_REDIS_PORT
};

const moscaSetting = {
    port: process.env.MQTT_MOSCA_PORT - 0,
    id: process.env.MQTT_MOSCA_ID,
    backend: pubsubBackend
};

const server = new mosca.Server(moscaSetting);

// method
server.on('clientConnected', function (client) {
    debug('onl:', client.id);
    publish(client.id, true);
});

server.on('clientDisconnected', function (client) {
    debug('off:', client.id);
    publish(client.id, false);
});

server.on('subscribed', function (topic, client) {
    if (client) {
        debug('sub:', topic, "for", client.id);
    }
});

server.on('published', function (packet, client) {
    if (/^[A-F0-9]{12}$/.test(packet.payload)) {
        debug('published:', packet.topic, packet.payload);
    }
    if (client) {
        debug('pub:', packet.topic, "from", client.id);
    }
});

server.on('ready', function () {
    console.log('Mosca server is up and running')
    server.authenticate = authorizer.authenticate;
    server.authorizePublish = authorizer.authorizePublish;
    server.authorizeSubscribe = authorizer.authorizeSubscribe;
});

function publish(id, state) {
    if (/^[A-F0-9]{12}$/.test(id)) {
        let message = {
            topic: `$SYS/${moscaSetting.id}/clients/state`,
            payload: JSON.stringify({
                mac: id,
                time: Date.now(),
                connected: state
            }),
            qos: 1,
            retain: false
        };

        server.publish(message, function () {
            debug('server publish:',`clients ${id} connected ${state}!`);
        });
    }
}