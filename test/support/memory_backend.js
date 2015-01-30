var MQEmitter = require('mqemitter');
var _ = require('underscore');

var MemoryBackend = function(config) {
  this.config = config;
  this.sessions = {};
  this.pubsub = new MQEmitter();
};

MemoryBackend.prototype.install = function(client) {
  var self = this;
  client._forwarder = function(packet) {
    self.stack.execute('forwardMessage', {
      client: client,
      packet: packet
    });
  }
};

MemoryBackend.prototype.closeOldSession = function(id) {
  if(this.sessions[id]) {
    this.sessions[id].client.destroy();
  }
};

MemoryBackend.prototype.newSession = function(ctx, callback) {
  this.closeOldSession(ctx.clientId);
  ctx.client._session = this.sessions[ctx.clientId] = {
    client: ctx.client,
    subscriptions: {}
  };
  callback(null, false);
};

MemoryBackend.prototype.resumeSession = function(ctx, callback) {
  var self = this;
  this.closeOldSession(ctx.clientId);
  ctx.client._session = this.sessions[ctx.clientId];
  if(ctx.client._session) {
    this.sessions[ctx.clientId].client = ctx.client;
    _.each(ctx.client._session.subscriptions, function(_, s){
      self.pubsub.on(s, ctx.client._forwarder);
    });
    // TODO: forward retained messages
    callback(null, true);
    // TODO: forward offline messages
  } else {
    this.newSession(ctx, callback);
  }
};

MemoryBackend.prototype.storeMessage = function(ctx, callback){
  if(callback) callback();
};

MemoryBackend.prototype.relayMessage = function(ctx, callback){
  this.pubsub.emit(ctx.packet);
  if(callback) callback();
};

MemoryBackend.prototype.subscribeTopic = function(ctx, callback) {
  ctx.client._session.subscriptions[ctx.topic] = 1;
  this.pubsub.on(ctx.topic, ctx.client._forwarder);
  if(callback) callback(null, ctx.qos);
};

MemoryBackend.prototype.unsubscribeTopic = function(ctx, callback) {
  delete ctx.client._session.subscriptions[ctx.topic];
  this.pubsub.removeListener(ctx.topic, ctx.client._forwarder);
  if(callback) callback();
};

module.exports = MemoryBackend;
