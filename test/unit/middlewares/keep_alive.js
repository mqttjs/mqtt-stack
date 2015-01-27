var EventEmitter = require('events').EventEmitter;

var KeepAlive = require('../../../src/middlewares/keep_alive');

describe('KeepAlive', function(){
  it('should respond to pingreq', function(done){
    var client = new EventEmitter();

    client.pingresp = done;

    var middleware = new KeepAlive();

    middleware.handle(client, {
      cmd: 'pingreq'
    });
  });

  it("should start default timer and close connection on inactivity", function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      client.on('uncleanDisconnect', done);
    };

    var middleware = new KeepAlive({
      defaultTimeout: 0.001
    });

    middleware.install(client);
  });

  it("should restart timer and close connection on inactivity", function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      client.on('uncleanDisconnect', done);
    };

    var middleware = new KeepAlive();

    middleware.handle(client, {
      cmd: 'connect',
      keepalive: 0.001
    }, function(){});
  });
});
