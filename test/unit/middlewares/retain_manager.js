var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var stackHelper = require('../../support/stack_helper');
var RetainManager = require('../../../src/middlewares/retain_manager');

describe('RetainManager', function(){
  it('should store retaines messages and reset flag', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'publish',
      topic: 'cool',
      payload: 'cool',
      qos: 0,
      retain: true
    };

    var middleware = new RetainManager({
      storeRetainedMessage: function(ctx) {
        assert.deepEqual(ctx.packet, packet);
      }
    });

    stackHelper.executeOnSelf(middleware);

    middleware.handle(stream, packet, function(){
      assert.equal(packet.retain, false);
      done();
    });
  });

  it('should lookup retained messages on subscribe', function(done){
    var stream = new EventEmitter();

    var packet = {
      topic: 'foo',
      payload: 'bar',
      qos: 1,
      retain: true
    };

    var middleware = new RetainManager({
      lookupRetainedMessages: function(ctx, callback) {
        callback(null, [packet]);
      },
      forwardMessage: function(ctx){
        assert.deepEqual(ctx.packet, packet);
        done();
      }
    });

    stackHelper.executeOnSelf(middleware);

    middleware.subscribeTopic({
      client: stream,
      topic: 'foo'
    }, function(){});
  });
});
