"use strict";
let Middleware = require('../utils/middleware');
let Timer = require('../utils/timer');

/**
 * KeepAlive Middleware
 *
 * TODO: add min and max values for client keepalive?
 * TODO: flag to discard 0 keepalive?
 *
 * Required callbacks:
 * - closeClient
 *
 */
class KeepAlive extends Middleware {
    /**
     * constructor
     *
     * @param config.defaultTimeout - the default timeout
     * @param config.grace - the grace to be allowed
     */
    constructor(config) {
        let defaults = {
            defaultTimeout: false,
            grace: 2
        };
        super(config, defaults);
    }

    /**
     * Starts the default timer and executes 'closeClient' on no activity.
     *
     * @param client
     */
    install(client) {
        let self = this;
        if (this.config.defaultTimeout) {
            client._keep_alive_timer = new Timer(this.config.defaultTimeout * 1000, function () {
                return self.stack.execute('closeClient', {
                    client: client
                });
            });
        }
    }

    /**
     * Starts timer with settings read from 'connect' packet,
     * resets timer on any client activity, handles and
     * dismisses 'pingreq' packets, executes 'closeClient'
     * if client misses a ping
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        let self = this;
        if (packet.cmd == 'connect') {
            if (client._keep_alive_timer) {
                client._keep_alive_timer.clear();
            }

            if (packet.keepalive > 0) {
                let timeout = packet.keepalive * 1000 * this.config.grace;

                client._keep_alive_timer = new Timer(timeout, function () {
                    self.stack.execute('closeClient', {
                        client: client
                    });
                });
            }

            return next();
        } else {
            if (client._keep_alive_timer) {
                client._keep_alive_timer.reset();
            }

            if (packet.cmd == 'pingreq') {
                return client.write({
                    cmd: 'pingresp'
                }, done);
            } else {
                return next();
            }
        }
    }
}

module.exports = KeepAlive;
