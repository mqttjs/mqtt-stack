var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var Connection = require('../../../src/middlewares/connection');

describe('Connection', function(){
  it('should close client if first packet is not a "connect"', function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      assert(client._dead);
      done();
    };

    var middleware = new Connection();

    middleware.install(client);

    assert(!client._dead);

    middleware.handle(client, {
      cmd: 'test'
    }, function(){});
  });

  it('should close client if "connect" is sent more than once', function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      assert(client._dead);
      client.on('uncleanDisconnect', done);
    };

    var middleware = new Connection();

    middleware.install(client);

    assert(!client._dead);

    middleware.handle(client, {
      cmd: 'connect'
    }, function(){});

    middleware.handle(client, {
      cmd: 'connect'
    });
  });

  it("should close client and emit 'cleanDisconnect' on 'disconnect' package", function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      assert(client._dead);
      client.on('cleanDisconnect', done);
    };

    var middleware = new Connection();

    middleware.install(client);

    assert(!client._dead);

    middleware.handle(client, {
      cmd: 'connect'
    }, function(){});

    middleware.handle(client, {
      cmd: 'disconnect'
    }, function(){});
  });

  it("should emit 'uncleanDisconnect' on 'close' event", function(done){
    var client = new EventEmitter();

    client.on('uncleanDisconnect', function(){
      assert(client._dead);
      done();
    });

    var middleware = new Connection();

    middleware.install(client);

    assert(!client._dead);

    client.emit('close');
  });

  it("should close client and emit 'uncleanDisconnect' on 'error' event", function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      assert(client._dead);
      client.on('uncleanDisconnect', done);
    };

    var middleware = new Connection();

    middleware.install(client);

    assert(!client._dead);

    client.emit('error');
  });

  it('should close client if protocol is not mqtt 4', function(done){
    var client = new EventEmitter();

    client.destroy = function() {
      assert(client._dead);
      done();
    };

    var middleware = new Connection({
      forceMQTT4: true
    });

    middleware.install(client);

    assert(!client._dead);

    middleware.handle(client, {
      cmd: 'connet',
      protocolId: 'hello'
    }, function(){});
  });
});
