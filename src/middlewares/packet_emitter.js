"use strict";
let Middleware = require('../utils/middleware');

/**
 * PacketEmitter Middleware
 *
 * Enables legacy handling of clients with events.
 */
class PacketEmitter extends Middleware {
    /**
     * Sets client handler
     *
     * @param {function} clientHandler
     */
    setClientHandler(clientHandler) {
        this.clientHandler = clientHandler;
    }

    /**
     * Passes the client to the 'clientHandler'
     *
     * @param client
     */
    install(client) {
        this.clientHandler(client);
    }

    /**
     * Emits packet as event.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        client.emit(packet.cmd, packet);
        done();
    }
}

module.exports = PacketEmitter;
