var mqtt = require('mqtt-server');

var stack = require('./index');

var MemoryBackend = require('./test/support/memory_backend');

this.stack = new stack.Stack();

this.stack.use(new MemoryBackend());

this.stack.use(new stack.Connection());
this.stack.use(new stack.KeepAlive());
this.stack.use(new stack.LastWill());
this.stack.use(new stack.SessionManager());
this.stack.use(new stack.RetainManager());
this.stack.use(new stack.InboundManager());
this.stack.use(new stack.OutboundManager());
this.stack.use(new stack.SubscriptionManager());

var port = process.env['PORT'] || 1883;

this.server = mqtt({
  mqtt: {
    protocol: 'tcp',
    port: port
  }
}, {
  emitEvents: false
}, this.stack.handle.bind(this.stack));

this.server.listen(function(){
  console.log('listening on', port)
});
