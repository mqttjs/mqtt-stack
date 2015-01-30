var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var stackHelper = require('../../support/stack_helper');
var SubscriptionManager = require('../../../src/middlewares/subscription_manager');

describe('SubscriptionManager', function(){
  it('should execute "subscribeTopic" for each subscription', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'subscribe',
      subscriptions: [{
        topic: 'foo',
        qos: 1
      }]
    };

    stream.suback = function(packet) {
      assert(packet.granted, [1]);
      done();
    };

    var middleware = new SubscriptionManager({
      subscribeTopic: function(ctx, callback){
        assert.equal(ctx.client, stream);
        assert.equal(ctx.topic, 'foo');
        assert.equal(ctx.qos, 1);
        callback(null, 1);;
      }
    });

    stackHelper.executeOnSelf(middleware);

    middleware.handle(stream, packet);
  });

  it('should execute "unsubscribeTopic" for each unsubscription', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'unsubscribe',
      unsubscriptions: ['foo']
    };

    stream.unsuback = function(){
      done();
    };

    var middleware = new SubscriptionManager({
      unsubscribeTopic: function(ctx, callback){
        assert.equal(ctx.client, stream);
        assert.equal(ctx.topic, 'foo');
        callback(null, 1);
      }
    });

    stackHelper.executeOnSelf(middleware);

    middleware.handle(stream, packet);
  });
});
