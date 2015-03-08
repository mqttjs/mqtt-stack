var assert = require('assert');

var stackHelper = require('../../support/stack_helper');
var Authorization = require('../../../src/middlewares/authorization');

describe('Authorization', function(){
  it('should pass packet on successful authorization', function(done){
    var client = {};

    var packet = {
      cmd: 'test'
    };

    var middleware = new Authorization();

    stackHelper.mockExecute(middleware, {
      authorizePacket: function(ctx, store, callback){
        assert.equal(ctx.client, client);
        assert.equal(ctx.packet, packet);
        store.valid = true;
        callback();
      }
    });

    middleware.handle(client, packet, done);
  });

  it('should dismiss packet on unsuccessful authorization', function(done){
    var client = {};

    var packet = {
      cmd: 'test'
    };

    var middleware = new Authorization();

    stackHelper.mockExecute(middleware, {
      authorizePacket: function(ctx, store, callback){
        assert.equal(ctx.client, client);
        assert.equal(ctx.packet, packet);
        callback();
      }
    });

    middleware.handle(client, packet, function(){}, done);
  });
});
