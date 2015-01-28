var assert = require('assert');

var f = require('../support/factory');

describe('QoS1', function(){
  it('should relay and forward message', function(done){
    f.client(function(client1) {
      f.client(function (client2) {
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
