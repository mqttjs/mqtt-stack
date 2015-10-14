global.port = 1883;

if (process.env['PORT']) {
    global.port = process.env['PORT'];
}

global.hostname = '0.0.0.0';

if (process.env['HOSTNAME']) {
    global.hostname = process.env['HOSTNAME'];
}

global.speed = 0.01;

if (process.env['NORMAL_SPEED']) {
    global.speed = 1;
}

var broker;
var spec = require('../spec/index');
var TestBroker = require('./test_broker');

before(function (done) {
    broker = new TestBroker(global.port, global.hostname);
    broker.listen(done)
});
spec.setup({
    host: global.hostname,
    port: global.port
});
spec.registerMochaTests();
after(function () {
    broker.close();
});