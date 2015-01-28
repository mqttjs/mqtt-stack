var assert = require('assert');

var f = require('../support/factory');

describe('LastWill', function(){
  it('should send last will if requested', function(done){
    f.client({
      will: {
        topic: '/last-will-1',
        payload: 'hello'
      }
    }, function(client1){
      f.client(function(client2){
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
