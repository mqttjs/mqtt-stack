var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var PacketEmitter = require('../../../src/middlewares/packet_emitter');

describe('PacketEmitter', function(){
  it('should emit packets as events', function(done){
    var myclient = new EventEmitter();

    var packet = {
      cmd: 'test',
      value: 1
    };

    var middleware = new PacketEmitter();
    middleware.setClientHandler(function(client){
      client.on('test', function(_packet){
        assert.equal(_packet, packet);
      });
    });

    middleware.install(myclient);
    middleware.handle(myclient, packet, function(){}, done);
  });
});
