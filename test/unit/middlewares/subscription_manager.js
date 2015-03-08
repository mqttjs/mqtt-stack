var assert = require('assert');

var stackHelper = require('../../support/stack_helper');
var SubscriptionManager = require('../../../src/middlewares/subscription_manager');

describe('SubscriptionManager', function(){
  it('should execute "subscribeTopic" for one subscription', function(done){
    var stream = {};

    var packet = {
      cmd: 'subscribe',
      subscriptions: [{
        topic: 'foo',
        qos: 1
      }]
    };

    stream.push = function(packet) {
      assert.deepEqual(packet.granted, [1]);
    };

    var middleware = new SubscriptionManager();

    stackHelper.mockExecute(middleware, {
      subscribeTopic: function(ctx, store, callback){
        assert.equal(ctx.client, stream);
        assert.equal(ctx.topic, 'foo');
        assert.equal(ctx.qos, 1);
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });

  it('should execute "subscribeTopic" for multiple subscription', function(done){
    var stream = {};

    var packet = {
      cmd: 'subscribe',
      subscriptions: [{
        topic: 'foo',
        qos: 1
      }, {
        topic: 'bar',
        qos: 0
      }, {
        topic: 'baz',
        qos: 2
      }]
    };

    stream.push = function(packet) {
      assert.deepEqual(packet.granted, [1, 0, 2]);
    };

    var middleware = new SubscriptionManager();

    stackHelper.mockExecute(middleware, {
      subscribeTopic: function(ctx, store, callback){
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });

  it('should execute "unsubscribeTopic" for each unsubscription', function(done){
    var stream = {};

    var packet = {
      cmd: 'unsubscribe',
      unsubscriptions: ['foo']
    };

    stream.push = function(){};

    var middleware = new SubscriptionManager();

    stackHelper.mockExecute(middleware, {
      unsubscribeTopic: function(ctx, callback){
        assert.equal(ctx.client, stream);
        assert.equal(ctx.topic, 'foo');
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });
});
