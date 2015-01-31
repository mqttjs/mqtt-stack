var mqtt = require('mqtt-server');

var stack = require('../../index');
var MemoryBackend = require('./memory_backend');

var FakeBroker = function(port){
  this.stack = new stack.Stack();

  this.stack.use(new MemoryBackend());

  this.stack.use(new stack.Connection({
    forceMQTT4: true
  }));

  this.stack.use(new stack.KeepAlive({
    defaultTimeout: 1,
    grace: global.speed
  }));

  this.stack.use(new stack.LastWill());
  this.stack.use(new stack.SessionManager());
  this.stack.use(new stack.RetainManager());
  this.stack.use(new stack.InboundManager());
  this.stack.use(new stack.OutboundManager());
  this.stack.use(new stack.SubscriptionManager());

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
