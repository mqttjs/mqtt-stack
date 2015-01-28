var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var InboundManager = require('../../../src/middlewares/inbound_manager');

describe('InboundManager', function(){
  it('should call "storeMessage" and "relayMessage"', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'publish',
      topic: 'hello',
      payload: 'cool'
    };

    var stored;

    var middleware = new InboundManager({
      storeMessage: function(ctx, callback){
        assert.equal(stream, ctx.client);
        assert.equal(packet, ctx.packet);
        assert.equal(packet.topic, ctx.topic);
        assert.equal(packet.payload, ctx.payload);
        stored = true;
        callback();
      },
      relayMessage: function(ctx){
        assert.equal(stream, ctx.client);
        assert.equal(packet, ctx.packet);
        assert.equal(packet.topic, ctx.topic);
        assert.equal(packet.payload, ctx.payload);
        assert(stored);
        done();
      }
    });

    middleware.handle(stream, packet);
  });

  it('should send "puback" on QoS 1', function(done){
    var stream = new EventEmitter();

    stream.puback = function(){
      done();
    };

    var packet = {
      cmd: 'publish',
      qos: 1
    };

    var middleware = new InboundManager();
    middleware.handle(stream, packet);
  });
});
