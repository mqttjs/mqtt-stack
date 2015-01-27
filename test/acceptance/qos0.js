var mqtt = require('mqtt');
var assert = require('assert');

describe('QoS0', function(){
  it('should broadcast and forward message', function(done){
    var client1 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT']);
    var client2 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT']);

    client1.once('connect', function(){
      client2.once('connect', function(){
        client1.subscribe('/qos-0', function(){
          client2.publish('/qos-0', 'hello');
        });
        client1.on('message', function(topic, payload, packet){
          assert.equal(topic, '/qos-0');
          assert.equal(payload, 'hello');
          assert.equal(packet.qos, 0);
          done();
        });
      });
    });
  });
});
