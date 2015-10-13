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
 * Required callbacks:
 * - storeSubscription
 * - clearSubscriptions
 * - lookupSubscriptions
 * - storeRetainedMessage
 * - lookupRetainedMessages
 * - relayMessage
 * - subscribeTopic
 * - unsubscribeTopic
 *
 * TODO: subscribeTopic may store QoS level and relayMessage may forward message with max. QoS level
 */
class MemoryBackend extends Middleware {
    constructor(config) {
        let defaults = {
            concurrency: 100
        };
        super(config, defaults);
        this.sessions = new Map();
        this.retainedMessages = new Qlobber(qlobber_mqtt_settings);
        this.pubsub = new Qlobber(qlobber_mqtt_settings);
        this.clientMap = new Map();
    }

    /* SessionManager */

    _ensureSession(ctx) {
        if (!this.sessions.has(ctx.client._client_id)) {
            this.sessions.set(ctx.client._client_id, new Set());
        }
    }

    /**
     * Keeps subscription list for client
     *
     * @param ctx
     * @param callback
     */
    storeSubscription(ctx, callback) {
        this._ensureSession(ctx);
        this.sessions.get(ctx.client._client_id).add({
            topic: ctx.topic,
            qos: ctx.qos
        });
        callback();
    }

    /**
     * Clears subscription list of client
     *
     * @param ctx
     * @param callback
     */
    clearSubscriptions(ctx, callback) {
        this.sessions.delete(ctx.client._client_id);
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
        this.sessions.get(ctx.client._client_id).forEach(function (s) {
            store.push(s);
        });
        callback();
    }

    /**
     * Keeps message to be retained for the topic
     *
     * @param ctx
     * @param callback
     */
    storeRetainedMessage(ctx, callback) {
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
     * @param callback
     */
    relayMessage(ctx, callback) {
        let listeners = _.uniq(this.pubsub.match(ctx.packet.topic));
        _.each(listeners, (listener) => {
            let client = this.clientMap.get(listener);
            if (client) {
                this.stack.execute('forwardMessage', {
                    client: client,
                    packet: ctx.packet
                }, callback);
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
     * @param __
     * @param callback
     */
    subscribeTopic(ctx, __, callback) {
        this.pubsub.add(ctx.topic, ctx.client._client_id);
        if (!this.clientMap.has(ctx.client._client_id)) {
            this.clientMap.set(ctx.client._client_id, ctx.client);
        }
        callback();
    }

    /**
     * Unsubscribe client from the topic
     *
     * @param ctx
     * @param callback
     */
    unsubscribeTopic(ctx, callback) {
        this.pubsub.remove(ctx.topic, ctx.client._client_id);
        callback();
    }
}

module.exports = MemoryBackend;