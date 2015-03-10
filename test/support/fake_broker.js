var css = require('create-stream-server');

var s = require('../../index');
var MemoryBackend = require('./memory_backend');

var FakeBroker = function(port){
  this.stack = new s.Stack();

  this.stack.use(new MemoryBackend());

  this.stack.use(new s.Connection({
    forceMQTT4: true
  }));

  this.stack.use(new s.KeepAlive({
    defaultTimeout: 1,
    grace: global.speed
  }));

  this.stack.use(new s.LastWill());
  this.stack.use(new s.SessionManager());
  this.stack.use(new s.RetainManager());
  this.stack.use(new s.InboundManager());
  this.stack.use(new s.OutboundManager());
  this.stack.use(new s.SubscriptionManager());

  this.server = css({
    mqtt: {
      protocol: 'tcp',
      port: port
    }
  }, this.stack.handler());
};

FakeBroker.prototype.listen = function(done) {
  this.server.listen(done);
};

FakeBroker.prototype.close = function() {
  this.server.destroy();
};

module.exports = FakeBroker;
