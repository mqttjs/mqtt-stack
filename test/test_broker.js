var net = require('net');

var s = require('../index');

var Broker = function (port, host) {
    var that = this;
    this.stack = new s.Stack(function (err) {
        console.error(err);
    });

    this.stack.use(new s.MemoryBackend());

    this.stack.use(new s.Connection({
        forceMQTT4: true
    }));

    this.stack.use(new s.KeepAlive({
        grace: global.speed
    }));

    this.stack.use(new s.LastWill());
    this.stack.use(new s.SessionManager());
    this.stack.use(new s.RetainManager());
    this.stack.use(new s.InboundManager());
    this.stack.use(new s.OutboundManager());
    this.stack.use(new s.SubscriptionManager());

    this.server = net.createServer(function (client) {
        var handler = that.stack.handler();
        handler(client);
    });
    this.server._port = port;
    this.server._host = host;
};

Broker.prototype.listen = function (done) {
    this.server.listen(this.server._port, this.server._host, done);
};

Broker.prototype.close = function () {
    this.server.close();
};

module.exports = Broker;