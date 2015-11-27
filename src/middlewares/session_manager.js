"use strict";
let Middleware = require('../utils/middleware');
let async = require('async');

/**
 * SessionManager Middleware
 *
 * Manages the clients session and calls callbacks to manage
 * the stored subscriptions for clean and unclean clients.
 *
 * Required Callbacks:
 * - storeSubscription
 * - lookupSubscriptions
 * - clearSubscriptions
 *
 * Exposed Callbacks:
 *  - subscribeTopic
 *  - unsubscribeTopic
 */
class SessionManager extends Middleware {
    /**
     * Stores subscriptions if the client is unclean.
     *
     * @param ctx
     * @param store
     * @param callback
     */
    subscribeTopic(ctx, store, callback) {
        if (ctx.client._managed_session) {
            this.stack.execute('storeSubscription', ctx, callback);
        } else {
            callback();
        }
    }

    /**
     * Remove subscription from storage if the client is unclean.
     *
     * @param ctx
     * @param store
     * @param callback
     */
    unsubscribeTopic(ctx, store, callback) {
        if (ctx.client._managed_session) {
            this.stack.execute('removeSubscription', ctx, callback);
        } else {
            callback();
        }
    }

    /**
     * Checks the clean flag on connect and calls appropriate functions and
     * sets clientId as client._id if unclean.
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     */
    handle(client, packet, next, done) {
        if (packet.cmd == 'connect') {
            client._id = packet.clientId;
            if (packet.clean) {
                client._managed_session = false;
                this._handleCleanClient(client, packet, next, done);
            } else {
                client._managed_session = true;
                this._handleUncleanClient(client, packet, next, done);
            }
        } else {
            return next();
        }
    }

    /**
     * For clean clients executes 'clearSubscriptions' and sends 'connack' with
     * sessionPresent' set to false as there are no subscriptions..
     *
     * @param client
     * @param packet
     * @param next
     * @param done
     * @private
     */
    _handleCleanClient(client, packet, next, done) {
        this.stack.execute('clearOfflineMessages', {clientId: packet.clientId}, {});
        this.stack.execute('clearSubscriptions', {
            client: client,
            packet: packet,
            clientId: packet.clientId
        }, function (err) {
            if (err) return next(err);

            client.write({
                cmd: 'connack',
                returnCode: 0,
                sessionPresent: false
            });

            return done();
        });
    }

    /**
     * For unclean clients
     * executes 'lookupOfflineMessages' and executes 'forwardMessage'
     * for each to send them to client
     * executes 'lookupSubscriptions' and executes
     * 'subscribeTopic' for each and finally sends a 'connack' with
     * 'sessionPresent' set to true if there are any subscriptions.
     * @param client
     * @param packet
     * @param next
     * @param done
     * @private
     */
    _handleUncleanClient(client, packet, next, done) {
        let self = this;

        let store = [];

        self.stack.execute('lookupOfflineMessages', {
            client: client,
            clientId: packet.clientId
        }, store, function (err) {
            if (err)  return next(err);

            let sentMessages = [];

            async.mapSeries(store, function (s, cb) {
                return self.stack.execute('forwardMessage', {
                    client,
                    packet: s.value
                }, {}, err => {
                    if(!err) sentMessages.push(s.key);
                    cb(err);
                });
            }, function (err) {
                if (err) return next(err);

                self.stack.execute('removeOfflineMessages', {
                    clientId: packet.clientId,
                    messageIds: sentMessages
                }, {}, function() {
                    let subscriptionsStore = [];
                    self.stack.execute('lookupSubscriptions', {
                        client: client,
                        packet: packet,
                        clientId: packet.clientId
                    }, subscriptionsStore, function (err) {
                        if (err) return next(err);

                        return async.mapSeries(subscriptionsStore, function (s, cb) {
                            return self.stack.execute('subscribeTopic', {
                                client: client,
                                packet: packet,
                                topic: s.topic,
                                qos: s.qos
                            }, {}, cb);
                        }, function (err) {
                            if (err) return next(err);

                            return client.write({
                                cmd: 'connack',
                                returnCode: 0,
                                sessionPresent: (subscriptionsStore.length > 0)
                            }, done);
                        });
                    });

                });
            });
        });
    }
}

module.exports = SessionManager;
