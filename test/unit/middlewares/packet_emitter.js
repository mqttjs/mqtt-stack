var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var PacketEmitter = require('../../../src/middlewares/packt_emitter');

describe('PacketEmitter', function(){
  it('should emit packets as events', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'test',
      value: 1
    };

    var middleware = new PacketEmitter(function(){
      client.on('test', function(_packet){
        assert.equal(_packet, packet);
        done();
      });
    });

    middleware.install(client);
    middleware.handle(client, packet);
  });
});
