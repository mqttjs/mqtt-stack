var mqtt = require('mqtt');
var assert = require('assert');

describe('LastWill', function(){
  it('should send last will if requested', function(done){
    var client1 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT'], {
      will: {
        topic: '/last-will-1',
        payload: 'hello'
      }
    });

    client1.once('connect', function(){
      var client2 = mqtt.connect('mqtt://0.0.0.0:' + process.env['PORT']);
      client2.once('connect', function(){
        client2.on('message', function(topic, payload){
          assert.equal(topic, '/last-will-1');
          assert.equal(payload, 'hello');
          done();
        });
        client2.subscribe('/last-will-1', function(){
          client1.stream.end();
        });
      });
    });
  });
});
