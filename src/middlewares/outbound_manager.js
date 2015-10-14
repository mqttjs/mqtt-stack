"use strict";
let Middleware = require('../utils/middleware');

/**
 * OutboundManager Middleware
 *
 * Manages outgoing messages.
 *
 * Exposed callbacks:
 * - forwardMessage
 */
class OutboundManager extends Middleware {
    /**
     * Forward messages to the client.
     *
     * @param ctx
     * @param callback
     */
    forwardMessage(ctx, callback) {
        ctx.client.write({
            cmd: 'publish',
            topic: ctx.packet.topic,
            payload: ctx.packet.payload,
            qos: ctx.packet.qos,
            retain: ctx.packet.retain,
            messageId: Math.random() * 60000
        }, callback);
    }

    handle(client, packet, next, done) {
        if (packet.cmd == 'puback') {
            //TODO: do something
            return done();
        } else {
            return next();
        }
    }
}

module.exports = OutboundManager;
