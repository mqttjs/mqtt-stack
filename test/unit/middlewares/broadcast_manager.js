var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var BroadcastManager = require('../../../src/middlewares/broadcast_manager');

describe('BroadcastManager', function(){
  it('should call "storeMessage" and "broadcastMessage"', function(done){
    var stream = new EventEmitter();

    var packet = {
      cmd: 'publish',
      topic: 'hello',
      payload: 'cool'
    };

    var stored;

    var middleware = new BroadcastManager({
      storeMessage: function(ctx, callback){
        assert.equal(stream, ctx.client);
        assert.equal(packet, ctx.packet);
        assert.equal(packet.topic, ctx.topic);
        assert.equal(packet.payload, ctx.payload);
        stored = true;
        callback();
      },
      broadcastMessage: function(ctx){
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

    var middleware = new BroadcastManager();
    middleware.handle(stream, packet);
  });
});
