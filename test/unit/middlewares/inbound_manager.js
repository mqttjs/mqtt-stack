var assert = require('assert');

var stackHelper = require('../../support/stack_helper');
var InboundManager = require('../../../src/middlewares/inbound_manager');

describe('InboundManager', function(){
  it('should call "relayMessage"', function(done){
    var stream = {};

    var packet = {
      cmd: 'publish',
      topic: 'hello',
      payload: 'cool'
    };

    var middleware = new InboundManager();

    stackHelper.mockExecute(middleware, {
      relayMessage: function(ctx){
        assert.equal(stream, ctx.client);
        assert.equal(packet, ctx.packet);
        assert.equal(packet.topic, ctx.topic);
        assert.equal(packet.payload, ctx.payload);
        done();
      }
    });

    middleware.handle(stream, packet);
  });

  it('should send "puback" on QoS 1', function(done){
    var stream = {};

    stream.write = function(){};

    var packet = {
      cmd: 'publish',
      qos: 1
    };

    var middleware = new InboundManager();

    stackHelper.mockExecute(middleware, {
      relayMessage: function(ctx, callback) {
        callback();
      }
    });

    middleware.handle(stream, packet, function(){}, done);
  });
});
