var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var stackHelper = require('../../support/stack_helper');
var Authentication = require('../../../src/middlewares/authentication');

describe('Authentication', function(){
  it('should keep authenticating if unsuccesful', function(done){
    var client = new EventEmitter();

    client.connack = function(packet){
      assert.equal(packet.returnCode, 4);
    };

    var packet = {
      cmd: 'connect'
    };

    var middleware = new Authentication();

    stackHelper.mockExecute(middleware, {
      authenticateConnection: function(ctx, store, callback){
        assert.equal(ctx.client, client);
        assert.equal(ctx.packet, packet);
        store.valid = false;
        callback();
      }
    });

    middleware.handle(client, packet, function(){}, function(){});
    middleware.handle(client, packet, function(){}, done);
  });

  it('should pass packet if successful', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'connect',
      username: 'user',
      password: 'pass'
    };

    var middleware = new Authentication();

    stackHelper.mockExecute(middleware, {
      authenticateConnection: function(ctx, store, callback){
        assert.equal(ctx.username, 'user');
        assert.equal(ctx.password, 'pass');
        store.valid = true;
        callback();
      }
    });

    middleware.handle(client, packet, done);
  });

  it('should call error handler on error', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'connect'
    };

    var middleware = new Authentication();

    stackHelper.mockExecute(middleware, {
      authenticateConnection: function(ctx, store, callback){
        callback(true);
      }
    });

    middleware.handle(client, packet, function(err){
      assert(err);
      done();
    });
  });
});
