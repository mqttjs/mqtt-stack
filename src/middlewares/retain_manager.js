"use strict";
let Middleware = require('../utils/middleware');
let _ = require('underscore');
let async = require('async');

/**
 * RetainManager Middleware
 *
 * - executes "storeRetainedMessage" for retained messages and resets flag
 * - lookups retained messages on "subscribeTopic" and executes "forwardMessage"
 */
class RetainManager extends Middleware {
    /**
     * Checks for every subscription if there are any retained messages. Executes
     * 'lookupRetainedMessages' and 'forwardMessage' with each result.
     *
     * @param ctx
     * @param __
     * @param callback
     */
    subscribeTopic(ctx, __, callback) {
        let self = this;

        let store = [];
        this.stack.execute('lookupRetainedMessages', {
            client: ctx.client,
            topic: ctx.topic
        }, store, function (err) {
            if (err) callback(err);

            if (store.length > 0) {
                return async.mapSeries(store, function (p, cb) {
                    return self.stack.execute('forwardMessage', {
                        client: ctx.client,
                        packet: p
                    }, cb);
                }, callback);
            } else {
                return callback();
            }
        });
    }

    /**
     * Checks for retained publish packets, stores them and clears retained flag.
     * Executes 'storeRetainedMessage'.
     *
     * @param client
     * @param packet
     * @param next
     */
    handle(client, packet, next) {
        if (packet.cmd == 'publish') {
            if (packet.retain) {
                let p = _.clone(packet);
                packet.retain = false;

                return this.stack.execute('storeRetainedMessage', {
                    client: client,
                    packet: p,
                    topic: p.topic
                }, next);
            } else {
                return next();
            }
        } else {
            return next();
        }
    }
}

module.exports = RetainManager;
