var net = require('net');
var mqttConn = require('mqtt-connection');
var mqtt = require('mqtt');
var crypto = require('crypto');

module.exports.c = function(){
  return 'spec_' + crypto.randomBytes(8).toString('hex');
};

module.exports.m = function(){
  return Math.floor(65535 * Math.random());
};

module.exports.t = function(){
  return '/topic_' + crypto.randomBytes(8).toString('hex');
};

module.exports.p = function(){
  return 'payload-' + crypto.randomBytes(8).toString('hex');
};

module.exports.client = function(options, handler, done){
  if(typeof options == 'function') {
    done = handler;
    handler = options;
    options = {};
  }

  if(!options.clientId) {
    options.clientId = this.c()
  }

  var c = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT'], options);

  if(handler) {
    c.once('connect', function(){
      handler(c);
    });
  }

  if(done) {
    c.stream.once('close', function(){
      setTimeout(done, 0);
    });
  }

  return c;
};

module.exports.rawClient = function(handler, done) {
  var self = this;
  var c = net.createConnection(process.env['PORT'], '0.0.0.0', function(){
    handler(mqttConn(c), {
      clientId: self.c(),
      protocolId: 'MQTT',
      protocolVersion: 4
    });

    if(done) {
      c.once('close', function(){
        setTimeout(done, 0);
      });
    }
  });
  return c;
};

module.exports.countDone = function(count, done) {
  return function() {
    count--;
    if(count === 0) {
      done();
    }
  };
};
