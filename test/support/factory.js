var net = require('net');
var mqttConn = require('mqtt-connection');
var mqtt = require('mqtt');
var crypto = require('crypto');

var cid = module.exports.cid = function(){
  return 'spec_' + crypto.randomBytes(8).toString('hex');
};

module.exports.mid = function(){
  return Math.floor(65535 * Math.random());
};

module.exports.client = function(options, handler, done){
  if(typeof options == 'function') {
    done = handler;
    handler = options;
    options = {};
  }

  if(!options.clientId) {
    options.clientId = cid()
  }

  var c = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT'], options);

  if(handler) {
    c.once('connect', function(){
      handler(c);
    });
  }

  if(done) {
    c.stream.once('close', function(){
      setTimeout(done(), 0);
    });
  }

  return c;
};

module.exports.rawClient = function(handler, done) {
  var c = net.createConnection(process.env['PORT'], '0.0.0.0', function(){
    handler(mqttConn(c), {
      clientId: cid(),
      protocolId: 'MQTT',
      protocolVersion: 4
    });

    if(done) {
      c.once('close', function(){
        setTimeout(done(), 0);
      });
    }
  });
  return c;
};

module.exports.countDone = function(count, done) {
  return function() {
    count--;
    if (count === 0) {
      done();
    }
  };
};
