"use strict";
let Middleware = require('../utils/middleware');
let async = require('async');

/**
 * SubscriptionManager Middleware
 *
 * Handles sunscription and unsubscriptions.
 *
 * Enabled callbacks:
 * - subscribeTopic
 * - unsubscribeTopic
 *
 * TODO: Forward messages according to the subscriptions and messages max QoS.
 * TODO: On Unsubscribe ensure that all QoS1 and QoS2 get completed
 */
class SubscriptionManager extends Middleware {
    /**
     * Handles 'subscribe' and 'unsubscribe' packets.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        if (packet.cmd == 'subscribe') {
            return this._handleSubscription(client, packet, next, done);
        } else if (packet.cmd == 'unsubscribe') {
            return this._handleUnsubscription(client, packet, next, done);
        } else {
            return next();
        }
    }

    /**
     * Executes 'subscribeTopic' for each individual subscription and sends a 'suback'.
     * The callback can change the granted subscription by editing 'store.grant'.
     *
     * @param client
     * @param packet
     * @param next
     * @private
     */
    _handleSubscription(client, packet, next, done) {
        let self = this;
        async.mapSeries(packet.subscriptions, function (s, cb) {
            let store = {grant: s.qos};
            return self.stack.execute('subscribeTopic', {
                client: client,
                packet: packet,
                topic: s.topic,
                qos: s.qos
            }, store, function (err) {
                if (err) return cb(err);

                return cb(null, store.grant === false ? 128 : store.grant);
            });
        }, function (err, results) {
            if (err) return next(err);

            return client.write({
                cmd: 'suback',
                messageId: packet.messageId,
                granted: results
            }, done);
        });
    }

    /**
     * Executes 'unsubscribeTopic' for each individual unsubscription and sends the 'unsuback'.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     * @private
     */
    _handleUnsubscription(client, packet, next, done) {
        let self = this;
        return async.mapSeries(packet.unsubscriptions, function (us, cb) {
            return self.stack.execute('unsubscribeTopic', {
                client: client,
                packet: packet,
                topic: us
            }, cb);
        }, function (err) {
            if (err) return next(err);

            return client.write({
                cmd: 'unsuback',
                messageId: packet.messageId
            }, done);
        });
    }
}

module.exports = SubscriptionManager;
