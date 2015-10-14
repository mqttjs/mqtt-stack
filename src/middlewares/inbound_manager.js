"use strict";
let Middleware = require('../utils/middleware');

/**
 * InboundManager Middleware
 *
 * Manages incomming publish packets.
 * Required callbacks:
 *  - relayMessage
 */
class InboundManager extends Middleware {
    /**
     * Handles 'publish' messages and executes 'relayMessage'. Sends
     * 'puback' for QoS1 messages.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        let self = this;
        if (packet.cmd == 'publish') {
            self.stack.execute('relayMessage', {
                client: client,
                packet: packet,
                topic: packet.topic,
                payload: packet.payload
            }, function (err) {
                if (err) return next(err);
                if (packet.qos == 1) {
                    return client.write({
                        cmd: 'puback',
                        messageId: packet.messageId
                    }, done);
                } else {
                    return done();
                }
            });
        } else {
            return next();
        }
    }
}

module.exports = InboundManager;
