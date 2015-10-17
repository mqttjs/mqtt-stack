"use strict";
let Middleware = require('../utils/middleware');
let crypto = require('crypto');

/**
 * Connection Middleware
 *
 * Manages the basic connection.
 *
 * Exposed callbacks:
 * - closeClient
 * Required callbacks:
 * - uncleanDisconnect
 * - cleanDisconnect
 */
class Connection extends Middleware {
    /**
     * constructor
     *
     * @param config.forceMQTT4 - enable to force newest protocol
     */
    constructor(config) {
        let defaults = {
            forceMQTT4: false
        };
        super(config, defaults);
    }

    /**
     * Will execute 'uncleanDisconnect' on 'close' and 'error'
     *
     * - closes client on 'error' and executes 'uncleanDisconnect'
     * - executes 'uncleanDisconnect' on 'close' without a previous 'disconnect' packet
     *
     * @param client
     */
    install(client) {
        let self = this;

        client._sent_first = false;
        client._sent_disconnect = false;

        client.on('error', function () {
            return client.close(function () {
                if (!client._sent_disconnect) {
                    return self.stack.execute('uncleanDisconnect', {
                        client: client
                    });
                }
            });
        });

        client.on('close', function () {
            return client.close(function () {
                if (!client._sent_disconnect) {
                    return self.stack.execute('uncleanDisconnect', {
                        client: client
                    });
                }
            });
        });
    }

    /**
     * Handles 'connect' and 'disconnect' packets.
     *
     * - closes client if first packet is not a 'connect' packet
     * - closes client if clientID is empty and clean = false
     * - closes client and executes 'uncleanDisconnect' if connect gets received more than once
     * - closes client on 'disconnect' and executes 'cleanDisconnect'
     * - assigns a unique client_id when id is missing
     * - forces proper mqtt protocol version and Id if enabled (forceMQTT4)
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        let self = this;
        if (!client._sent_first) {
            client._sent_first = true;
            if (packet.cmd == 'connect') {
                if (this.config.forceMQTT4 && (packet.protocolVersion !== 4 || packet.protocolId !== 'MQTT')) {
                    return client.close(done);
                } else if ((!packet.clientId || packet.clientId.length === 0) && packet.clean === false) {
                    return client.close(done);
                } else {
                    if (!packet.clientId || packet.clientId.length === 0) {
                        packet.clientId = crypto.randomBytes(16).toString('hex');
                    }
                    return next();
                }
            } else {
                return client.close(done);
            }
        } else {
            if (packet.cmd == 'connect') {
                return client.close(function () {
                    return self.stack.execute('uncleanDisconnect', {
                        client: client
                    }, done);
                });
            } else if (packet.cmd == 'disconnect') {
                client._sent_disconnect = true;
                return client.close(function () {
                    return self.stack.execute('cleanDisconnect', {
                        client: client
                    }, done);
                });
            } else {
                return next();
            }
        }
    }

    /**
     * Execute to immediately close the client and execute
     * 'uncleanDisconnect' right after.
     *
     * @param ctx
     * @param __
     * @param callback
     */
    closeClient(ctx, __, callback) {
        let self = this;
        return ctx.client.close(function () {
            self.stack.execute('uncleanDisconnect', ctx, callback);
        });
    }
}
module.exports = Connection;
