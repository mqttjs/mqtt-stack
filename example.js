var css = require('create-stream-server');

var s = require('./index');

var stack = new s.Stack();

stack.use(new s.MemoryBackend());
stack.use(new s.Connection());
stack.use(new s.KeepAlive());
stack.use(new s.LastWill());
stack.use(new s.SessionManager());
stack.use(new s.RetainManager());
stack.use(new s.InboundManager());
stack.use(new s.OutboundManager());
stack.use(new s.SubscriptionManager());

var port = process.env['PORT'] || 1883;

this.server = css({
  mqtt: {
    protocol: 'tcp',
    port: port
  }
}, stack.handler());

this.server.listen(function(){
  console.log('[serv] listening on', port)
});
