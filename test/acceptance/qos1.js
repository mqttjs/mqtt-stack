var mqtt = require('mqtt');
var assert = require('assert');

describe('QoS1', function(){
  it('should relay and forward message', function(done){
    var client1 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT']);
    var client2 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT']);

    client1.once('connect', function(){
      client2.once('connect', function(){
        client1.on('message', function(topic, payload, packet){
          assert.equal(topic, '/qos-1');
          assert.equal(payload, 'hello');
          assert.equal(packet.qos, 1);
          done();
        });

        client1.subscribe({
          '/qos-1': 1
        }, function(){
          client2.publish('/qos-1', 'hello', {
            qos: 1
          }, function(){
            // assert sent
          });
        });
      });
    });
  });
});
