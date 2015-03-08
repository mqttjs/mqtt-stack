var assert = require('assert');

var stackHelper = require('../../support/stack_helper');
var SessionManager = require('../../../src/middlewares/session_manager');

describe('SessionManager', function(){
  it('should call clearSubscriptions for clean client', function(done){
    var stream = {};

    stream.push = function(){
      assert(!packet.sessionPresent);
    };

    var packet = {
      cmd: 'connect',
      clean: true,
      clientId: 'foo'
    };

    var middleware = new SessionManager();

    stackHelper.mockExecute(middleware, {
      clearSubscriptions: function(ctx, callback) {
        assert(ctx.client, stream);
        assert(ctx.packet, packet);
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });

  it('should call lookupSubscriptions for unclean client', function(done){
    var stream = {};

    stream.push = function(packet){
      assert(packet.sessionPresent);
    };

    var packet = {
      cmd: 'connect',
      clientId: 'foo',
      clean: false
    };

    var packet2 = {
      topic: 'bar',
      qos: 0
    };

    var middleware = new SessionManager();

    stackHelper.mockExecute(middleware, {
      lookupSubscriptions: function(ctx, store, callback) {
        assert(ctx.client, stream);
        assert(ctx.packet, packet);
        store.push(packet2);
        callback();
      },
      subscribeTopic: function(ctx, store, callback) {
        assert(ctx.client, stream);
        assert(ctx.packet, packet2);
        assert.deepEqual(store, {});
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });

  it('should call storeSubscriptions for new subscriptions', function(done){
    var stream = {};

    stream.push = function(){};

    var packet = {
      topic: 'bar',
      qos: 0
    };

    var middleware = new SessionManager();

    stackHelper.mockExecute(middleware, {
      lookupSubscriptions: function(ctx, store, callback) {
        callback();
      },
      storeSubscription: function(ctx, callback) {
        assert(ctx.client, stream);
        assert(ctx.packet, packet);
        callback();
      }
    });

    middleware.handle(stream, {
      cmd: 'connect',
      clientId: 'foo',
      clean: false
    }, function(){}, function(){});

    middleware.subscribeTopic({
      client: stream,
      packet: packet
    }, {}, done);
  });
});
