"use strict";
let Middleware = require('../utils/middleware'),
    _ = require('underscore'),
    Qlobber = require('qlobber').Qlobber,
    qlobber_mqtt_settings = {
        separator: '/',
        wildcard_one: '+',
        wildcard_some: '#'
    };

/**
 * Simple backend with in-memory storage
 *
 * Exposed callbacks:
 * - storeSubscription
 * - clearSubscriptions
 * - lookupSubscriptions
 * - storeRetainedMessage
 * - lookupRetainedMessages
 * - relayMessage
 * - subscribeTopic
 * - unsubscribeTopic
 * Required Callbacks:
 * - forwardMessage
 */
class MemoryBackend extends Middleware {
    constructor(config) {
        let defaults = {
            concurrency: 100
        };
        super(config, defaults);
        this.sessions = new Map();
        this.offlineMessages = new Map();
        this.retainedMessages = new Qlobber(qlobber_mqtt_settings);
        this.pubsub = new Qlobber(qlobber_mqtt_settings);
        this.qos_store = new Qlobber(qlobber_mqtt_settings);
        this.clientMap = new Map();
    }

    /* SessionManager */

    _ensureSession(ctx) {
        if (!this.sessions.has(ctx.clientId)) {
            this.sessions.set(ctx.clientId, new Map());
        }
    }

    /**
     * Keeps subscription list for client
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    storeSubscription(ctx, __, callback) {
        this._ensureSession(ctx);
        this.sessions.get(ctx.clientId).set(ctx.topic, ctx.qos);
        callback();
    }

    /**
     * Remove subscription from client session
     *
     * @param ctx
     * @param __
     * @param callback
     */
    removeSubscription(ctx, __, callback) {
        this.sessions.get(ctx.clientId).delete(ctx.topic);
        callback();
    }

    /**
     * Clears subscription list of client
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    clearSubscriptions(ctx, __, callback) {
        this.sessions.delete(ctx.clientId);
        callback();
    }

    /**
     * Provides client's current subscription list
     *
     * @param ctx
     * @param store - contains the array of topics subscribed
     * @param callback
     */
    lookupSubscriptions(ctx, store, callback) {
        this._ensureSession(ctx);
        this.sessions.get(ctx.clientId).forEach(function (qos, topic) {
            store.push({topic, qos});
        });
        callback();
    }

    /**
     * Keeps message to be retained for the topic
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    storeRetainedMessage(ctx, __, callback) {
        this.retainedMessages.remove(ctx.topic);
        if (ctx.packet.payload !== '') {
            this.retainedMessages.add(ctx.topic, ctx.packet);
        }
        callback();
    }

    /**
     * Provides topic's current retained message
     *
     * @param ctx
     * @param store - contains message that retained
     * @param callback
     */
    lookupRetainedMessages(ctx, store, callback) {
        store = this.retainedMessages.match(ctx.topic);
        callback();
    }

    /**
     * Relay published message to subscribed clients
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    relayMessage(ctx, __, callback) {
        let listeners = _.uniq(this.pubsub.match(ctx.packet.topic));
        _.each(listeners, (listener) => {
            let client = this.clientMap.get(listener);
            let qos = Math.max(this.qos_store.match(listener + '/' + ctx.packet.topic));
            let packet;
            if(_.isUndefined(qos)) {
                packet = ctx.packet;
            }
            else {
                packet = _.clone(ctx.packet); //clone packet since its qos will be modified
                packet.qos = qos;
            }
            if (client) {
                this.stack.execute('forwardMessage', {
                    client: client,
                    packet: packet
                }, callback);
            }
            else {
                this.stack.execute('storeOfflineMessage', {
                    client: client,
                    packet: packet
                }, callback)
            }
        });
        if (listeners.length === 0) {
            callback();
        }
    }

    /**
     * Subscribe client to the topic
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    subscribeTopic(ctx, __, callback) {
        this.pubsub.add(ctx.topic, ctx.client._id);
        this.qos_store.add(ctx.client._id + '/' + ctx.topic, ctx.qos);
        if (!this.clientMap.has(ctx.client._id)) {
            this.clientMap.set(ctx.client._id, ctx.client);
        }
        callback();
    }

    /**
     * Unsubscribe client from the topic
     *
     * @param ctx
     * @param __ - not used
     * @param callback
     */
    unsubscribeTopic(ctx, __, callback) {
        this.pubsub.remove(ctx.topic, ctx.client._id);
        this.qos_store.remove(ctx.client._id + '/' + ctx.topic);
        callback();
    }


    /**
     * Ensures offline message store exists for client
     * @param ctx
     * @private
     */
    _ensureMessageStore(id) {
        if (!this.offlineMessages.has(id)) {
            this.offlineMessages.set(id, new Map());
        }
    }

    /**
     * Stores message for offline client
     * @param ctx
     * @param __
     * @param callback
     */
    storeOfflineMessage(ctx, __, callback) {
        this._ensureMessageStore(ctx.client._id);
        //dont care storing message if it does not have message id
        if(ctx.packet.messageId) this.offlineMessages.get(ctx.client._id).set(ctx.packet.messageId, ctx.packet);
        callback();
    }

    /**
     * Provides client's stored offline messages
     * @param ctx
     * @param store
     * @param callback
     */
    lookupOfflineMessages(ctx, store, callback) {
        this._ensureMessageStore(ctx.clientId);
        this.offlineMessages.get(ctx.clientId).forEach(function (value, key) {
            store.push({key, value});
        });
        callback();
    }

    /**
     * Removes messages from store.
     * @param ctx
     * @param __
     * @param callback
     */
    removeOfflineMessages(ctx, __, callback) {
        this._ensureMessageStore(ctx.clientId);
        const messages = this.offlineMessages.get(ctx.clientId);
        ctx.messageIds.forEach(function (messageId) {
            messages.delete(messageId);
        });
        callback();
    }

    /**
     * Removes all offline messages of given client.
     * @param ctx
     * @param __
     * @param callback
     */
    clearOfflineMessages(ctx, __, callback) {
        this.offlineMessages.delete(ctx.clientId);
        callback();
    }
}

module.exports = MemoryBackend;
