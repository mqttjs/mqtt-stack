var _ = require('underscore');

/**
 * OutboundManager Middleware
 *
 * Manages outgoing messages.
 *
 * Enabled callbacks:
 * - forwardMessage
 */
var OutboundManager = function(){};

/**
 * Forward messages to the client.
 *
 * @param ctx
 * @param callback
 */
OutboundManager.prototype.forwardMessage = function(ctx, callback) {
  ctx.client.publish({
    topic: ctx.packet.topic,
    payload: ctx.packet.payload,
    qos: ctx.packet.qos,
    retain: ctx.packet.retain,
    messageId: Math.random()*60000
  });
  if(callback) callback();
};

OutboundManager.prototype.handle = function(client, packet, next){
  if(packet.cmd == 'puback') {
    //TODO: do something
  } else {
    return next();
  }
};

module.exports = OutboundManager;
