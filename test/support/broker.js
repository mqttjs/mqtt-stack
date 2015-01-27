var EventEmitter = require('events').EventEmitter;
var mqtt = require('mqtt-server');
var MQEmitter = require('mqemitter');

var stack = require('../../index');

var Broker = function(){
  var self = this;

  this.sessions = {};

  this.pubsub = new MQEmitter();

  this.stack = new stack.Stack();

  this.stack.use(new stack.Connection({
    forceMQTT4: true
  }));

  this.stack.use(new stack.KeepAlive({
    defaultTimeout: 1
  }));

  this.stack.use(new stack.LastWill());

  this.stack.use(new stack.SessionManager({
    newSession: function(ctx, callback) {
      ctx.client._session = self.sessions[ctx.clientId] = {
        subscriptions: [],
        listeners: {}
      };
      callback(null, false);
    },
    resumeSession: function(ctx, callback) {
      ctx.client._session = self.sessions[ctx.clientId];
      if(self.client._session) {
        // load session and subscriptions
        // forward retained messages
        callback(null, true);
        // forward offline messages
      } else {
        this.newSession(ctx, callback);
      }
    }
  }));

  this.stack.use(new stack.PublishManager({
    broadcastMessage: function(ctx, callback){
      self.pubsub.emit(ctx.packet);
      callback();
    }
  }));

  this.stack.use(new stack.ForwardManager());

  this.stack.use(new stack.SubscriptionManager({
    subscribeTopic: function(ctx, callback) {
      if(!ctx.client._session.listeners[ctx.topic]) {
        ctx.client._session.listeners[ctx.topic] = self.pubsub.on(ctx.topic, function(packet){
          ctx.client.emit('forwardMessage', packet);
        });
      }
      callback(null, ctx.qos);
    },
    unsubscribeTopic: function(ctx, callback) {
      if(ctx.client._session.listeners[ctx.topic]) {
        self.pubsub.removeListener(ctx.topic, ctx.client._session.listeners[ctx.topic]);
        delete ctx.client._session.listeners[ctx.topic];
      }
      callback(null);
    }
  }));

  this.server = mqtt.createServer({
    emitEvents: false
  }, this.stack.handle.bind(this.stack));
};

Broker.prototype.listen = function(port, done) {
  this.server.listen(port, done);
};

Broker.prototype.destroy = function() {
  this.server.close();
};

module.exports = Broker;
