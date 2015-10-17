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
        this.retainedMessages = new Qlobber(qlobber_mqtt_settings);
        this.pubsub = new Qlobber(qlobber_mqtt_settings);
        this.qos_store = new Qlobber(qlobber_mqtt_settings);
        this.clientMap = new Map();
    }

    /* SessionManager */

    _ensureSession(ctx) {
        if (!this.sessions.has(ctx.clientId)) {
            this.sessions.set(ctx.clientId, new Set());
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
        this.sessions.get(ctx.clientId).add({
            topic: ctx.topic,
            qos: ctx.qos
        });
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
        this.sessions.get(ctx.clientId).forEach(function (s) {
            store.push(s);
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
        this.pubsub.add(ctx.topic, ctx.client._client_id);
        this.qos_store.add(ctx.client._client_id + '/' + ctx.topic, ctx.qos);
        if (!this.clientMap.has(ctx.client._client_id)) {
            this.clientMap.set(ctx.client._client_id, ctx.client);
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
        this.pubsub.remove(ctx.topic, ctx.client._client_id);
        this.qos_store.remove(ctx.client._client_id + '/' + ctx.topic);
        callback();
    }
}

module.exports = MemoryBackend;
