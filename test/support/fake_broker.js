var EventEmitter = require('events').EventEmitter;
var mqtt = require('mqtt-server');
var MQEmitter = require('mqemitter');

var stack = require('../../index');

var FakeBroker = function(port){
  var self = this;

  this.sessions = {};

  this.pubsub = new MQEmitter();

  this.stack = new stack.Stack();

  this.stack.use(new stack.Connection({
    forceMQTT4: true
  }));

  this.stack.use({
    install: function(client) {
      client._forwarder = function(packet) {
        client.emit('forwardMessage', packet);
      }
    },
    handle: function(_, __, next) {
      next();
    }
  });

  this.stack.use(new stack.KeepAlive({
    defaultTimeout: 1
  }));

  this.stack.use(new stack.LastWill());

  function closeOldSession(ctx) {
    if(self.sessions[ctx.clientId]) {
      self.sessions[ctx.clientId].client.destroy();
    }
  }

  this.stack.use(new stack.SessionManager({
    newSession: function(ctx, callback) {
      closeOldSession(ctx);

      ctx.client._session = self.sessions[ctx.clientId] = {
        client: ctx.client
      };
      callback(null, false);
    },
    resumeSession: function(ctx, callback) {
      closeOldSession(ctx);

      ctx.client._session = self.sessions[ctx.clientId];
      if(ctx.client._session) {
        self.sessions[ctx.clientId].client = ctx.client;
        // load session and subscriptions
        // forward retained messages
        callback(null, true);
        // forward offline messages
      } else {
        this.newSession(ctx, callback);
      }
    }
  }));

  this.stack.use(new stack.InboundManager({
    relayMessage: function(ctx, callback){
      self.pubsub.emit(ctx.packet);
      callback();
    }
  }));

  this.stack.use(new stack.OutboundManager());

  this.stack.use(new stack.SubscriptionManager({
    subscribeTopic: function(ctx, callback) {
      self.pubsub.on(ctx.topic, ctx.client._forwarder);
      callback(null, ctx.qos);
    },
    unsubscribeTopic: function(ctx, callback) {
      self.pubsub.removeListener(ctx.topic, ctx.client._forwarder);
      callback(null);
    }
  }));

  this.server = mqtt({
    mqtt: {
      protocol: 'tcp',
      port: port
    }
  }, {
    emitEvents: false
  }, this.stack.handle.bind(this.stack));
};

FakeBroker.prototype.listen = function(done) {
  this.server.listen(done);
};

FakeBroker.prototype.close = function() {
  this.server.destroy();
};

module.exports = FakeBroker;
