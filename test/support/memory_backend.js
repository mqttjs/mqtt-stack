var MQEmitter = require('mqemitter');
var mqttRegex = require('mqtt-regex');
var _ = require('underscore');

var MemoryBackend = function(config) {
  this.config = config;
  this.sessions = {};
  this.pubsub = new MQEmitter();
  this.retainedMessages = {};
};

MemoryBackend.prototype.install = function(client) {
  var self = this;
  client._forwarder = function(packet) {
    self.stack.execute('forwardMessage', {
      client: client,
      packet: packet
    });
  };
};

/* SessionManager */

//MemoryBackend.prototype.closeOldSession = function(id) {
//  if(this.sessions[id]) {
//    this.sessions[id].client.destroy();
//  }
//};

MemoryBackend.prototype._ensureSession = function(ctx) {
  if(!this.sessions[ctx.client._client_id]) {
    this.sessions[ctx.client._client_id] = [];
  }
};

MemoryBackend.prototype.storeSubscription = function(ctx, callback) {
  this._ensureSession(ctx);
  this.sessions[ctx.client._client_id].push({
    topic: ctx.topic,
    qos: ctx.qos
  });
  callback();
};

MemoryBackend.prototype.clearSubscriptions = function(ctx, callback) {
  delete this.sessions[ctx.client._client_id];
  callback();
};

MemoryBackend.prototype.lookupSubscriptions = function(ctx, store, callback) {
  this._ensureSession(ctx);
  _.each(this.sessions[ctx.client._client_id], function(s){
    store.push(s);
  });
  callback();
};

/* RetainManager */

MemoryBackend.prototype.storeRetainedMessage = function(ctx, callback){
  if(ctx.packet.payload == '') {
    delete this.retainedMessages[ctx.topic];
  } else {
    this.retainedMessages[ctx.topic] = ctx.packet;
  }

  if(callback) callback();
};

MemoryBackend.prototype.lookupRetainedMessages = function(ctx, callback) {
  var regex = mqttRegex(ctx.topic).regex;
  callback(null, _.filter(this.retainedMessages, function(p, t) {
    return t.search(regex) >= 0;
  }));
};

/* InboundManager */

MemoryBackend.prototype.relayMessage = function(ctx, callback){
  this.pubsub.emit(ctx.packet);
  if(callback) callback();
};

//MemoryBackend.prototype.storeMessage;

/* SubscriptionManager */

MemoryBackend.prototype.subscribeTopic = function(ctx, callback) {
  this.pubsub.on(ctx.topic, ctx.client._forwarder);
  if(callback) callback(null, ctx.qos);
};

MemoryBackend.prototype.unsubscribeTopic = function(ctx, callback) {
  this.pubsub.removeListener(ctx.topic, ctx.client._forwarder);
  if(callback) callback();
};

module.exports = MemoryBackend;
