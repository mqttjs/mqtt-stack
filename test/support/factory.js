var net = require('net');
var mqttConn = require('mqtt-connection');
var mqtt = require('mqtt');

module.exports.client = function(options, handler){
  if(typeof options == 'function') {
    handler = options;
    options = {};
  }

  var c = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT'], options);
  c.once('connect', function(){
    handler(c);
  });
  return c;
};

module.exports.rawClient = function(handler) {
  var c = net.createConnection(process.env['PORT'], '0.0.0.0', function(){
    handler(mqttConn(c));
  });
  return c;
};
