var net = require('net'),
    mqttStack = require('./index');

var stack = new mqttStack.Stack();

stack.use(new mqttStack.MemoryBackend());
stack.use(new mqttStack.Connection());
stack.use(new mqttStack.KeepAlive());
stack.use(new mqttStack.LastWill());
stack.use(new mqttStack.SessionManager());
stack.use(new mqttStack.RetainManager());
stack.use(new mqttStack.InboundManager());
stack.use(new mqttStack.OutboundManager());
stack.use(new mqttStack.SubscriptionManager());

var port = process.env['PORT'] || 1883;

var server = net.createServer(stack.handler());

server.listen(port, function(){
    console.log('[serv] listening on', port)
});