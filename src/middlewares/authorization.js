"use strict";
let Middleware = require('../utils/middleware');

/**
 * Authorization Middleware
 *
 * Authorizes invidual packet types.
 *
 * Enabled callbacks:
 * - authorizePacket
 */

class Authorization extends Middleware {
    /**
     * Executes 'authorizePacket' for every packet and only calls
     * propagates if authorization is valid.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        let store = {};
        this.stack.execute('authorizePacket', {
            client: client,
            packet: packet
        }, store, function (err) {
            if (err) return next(err);

            if (store.valid) {
                return next();
            } else {
                return done();
            }
        });
    }
}

module.exports = Authorization;
