"use strict";
let Middleware = require('../utils/middleware');
/**
 * Authentication Middleware
 *
 * Manges connection level authentication.
 *
 * Enabled callbacks:
 * - authenticateConnection
 */

class Authentication extends Middleware {
    /**
     * Flags all clients as not authenticated first.
     * @param client
     */
    install(client) {
        client._authenticated = false;
    }

    /**
     * Executes 'authenticateConnection' for every new 'connect'. Sends
     * 'connack' with 'returnCode: 4' and dismisses packet if authentication
     * fails
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        if (packet.cmd == 'connect') {
            if (!client._authenticated) {
                let store = {};
                this.stack.execute('authenticateConnection', {
                    client: client,
                    packet: packet,
                    username: packet.username,
                    password: packet.password
                }, store, function (err) {
                    if (err) return next(err);

                    if (store.valid) {
                        client._authenticated = true;
                        return next();
                    } else {
                        return client.write({
                            cmd: 'connack',
                            returnCode: 4
                        }, done);
                    }
                });
            }
        } else {
            return next();
        }
    }
}

module.exports = Authentication;
