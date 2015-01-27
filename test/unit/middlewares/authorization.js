var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var Authorization = require('../../../src/middlewares/authorization');

describe('Authorization', function(){
  it('should pass packet on successful authorization', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'test'
    };

    var middleware = new Authorization({
      test: function(ctx, callback){
        assert.equal(ctx.client, client);
        assert.equal(ctx.packet, packet);
        callback(null, true);
      }
    });

    middleware.handle(client, packet, done);
  });

  it('should dismiss packet on unsuccessful authorization', function(done){
    var client = new EventEmitter();

    var packet = {
      cmd: 'test'
    };

    var middleware = new Authorization({
      test: function(ctx, callback){
        assert.equal(ctx.client, client);
        assert.equal(ctx.packet, packet);
        callback(null, false);
        done();
      }
    });

    middleware.handle(client, packet);
  });
});
