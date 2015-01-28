var assert = require('assert');

var f = require('../support/factory');

describe('QoS0', function(){
  it('should relay and forward message', function(done){
    f.client(function(client1){
      f.client(function(client2){
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
