"use strict";
let Middleware = require('../utils/middleware');
let _ = require('underscore');

/**
 * LastWill Middleware
 *
 * Manages will packet.
 *
 * Exposed callbacks:
 *  - uncleanDisconnect
 */
class LastWill extends Middleware {
    /**
     * Injects will packet if available on 'uncleanDisconnect'.
     *
     * @param ctx
     * @param cb
     */
    uncleanDisconnect(ctx, cb) {
        let self = this;

        if (ctx.client._last_will) {
            let packet = _.defaults(ctx.client._last_will, {
                cmd: 'publish'
            });

            setImmediate(function () {
                self.stack.process(ctx.client, packet, function () {
                });
            });

            cb();
        }
    }

    /**
     * Looks for a will packet and stores it.
     *
     * @param client
     * @param packet
     * @param next
     */
    handle(client, packet, next) {
        if (packet.cmd == 'connect') {
            if (packet.will) {
                client._last_will = packet.will;
            }
        }

        return next();
    }
}

module.exports = LastWill;
