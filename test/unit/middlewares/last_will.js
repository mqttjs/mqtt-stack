var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var LastWill = require('../../../src/middlewares/last_will');

describe('LastWill', function(){
  it("should cache lastWill and inject on 'uncleanDisconnect'", function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'connect',
      will: {
        value: 1
      }
    };

    var middleware = new LastWill();

    middleware.stack = {
      runStack: function(_client, _packet) {
        assert(_client, client);
        assert.equal(_packet, packet.will);
        done();
      }
    };

    middleware.handle(client, packet, function(){});
    middleware.uncleanDisconnect({
      client: client
    });
  });
});
