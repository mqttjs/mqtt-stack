var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var OutboundManager = require('../../../src/middlewares/outbound_manager');

describe('OutboundManager', function(){
  it('should forward packets when "forwardMessage" is executed', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'publish',
      topic: 'cool',
      payload: 'cool',
      qos: 0
    };

    var middleware = new OutboundManager();

    stream.publish = function(_packet){
      assert.equal(_packet.topic, packet.topic);
      assert.equal(_packet.payload, packet.payload);
      assert.equal(_packet.qos, packet.qos);
      done();
    };

    middleware.forwardMessage({
      client: stream,
      packet: packet
    });
  });

  it('should handle "puback" on QoS 1 and call "deleteMessage"', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'publish',
      topic: 'cool',
      payload: 'cool',
      qos: 1
    };

    var packet2 = {
      cmd: 'puback',
      messageId: 10
    };

    var middleware = new OutboundManager({
      deleteMessage: function(ctx){
        assert.equal(packet2, ctx.packet);
        assert.equal(stream, ctx.client);
        assert.equal(packet2.messageId, ctx.messageId);
        done();
      }
    });

    stream.publish = function(){
      middleware.handle(stream, packet2);
    };

    middleware.forwardMessage({
      client: stream,
      packet: packet
    });
  });
});
