var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var Authentication = require('../../../src/middlewares/authentication');

describe('Authentication', function(){
  it('should keep authenticating if unsuccesful', function(done){
    var client = new EventEmitter();

    var i = 0;

    client.connack = function(packet){
      assert.equal(packet.returnCode, 4);
      i++; if(i == 2) done();
    };

    var packet = {
      cmd: 'connect'
    };

    var middleware = new Authentication(function(ctx, callback){
      assert.equal(ctx.client, client);
      assert.equal(ctx.packet, packet);
      callback(null, false);
    });

    middleware.handle(client, packet);
    middleware.handle(client, packet);
  });

  it('should pass packet if successful', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'connect',
      username: 'user',
      password: 'pass'
    };

    var middleware = new Authentication(function(ctx, callback){
      assert.equal(ctx.username, 'user');
      assert.equal(ctx.password, 'pass');
      callback(null, true);
    });

    middleware.handle(client, packet, done);
  });

  it('should call error handler on error', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'connect'
    };

    var middleware = new Authentication(function(ctx, callback){
      callback(true);
    });

    middleware.handle(client, packet, function(err){
      assert(err);
      done();
    });
  });
});
