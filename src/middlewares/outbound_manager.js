/**
 * OutboundManager Middleware
 *
 * - forwards messages to the client when 'forwardMessage' is executed
 * - handles 'puback' in QoS1 flow
 *
 * TODO: Storing and deleting messages
 * TODO: QoS2 support
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new OutboundManager({
 *   deleteMessage: function(ctx, callback) {
 *     // delete stored message
 *   }
 * }));
 */

var _ = require('underscore');

var OutboundManager = function(config){
  this.config = _.defaults(config || {}, {
    deleteMessage: function(ctx, callback){
      callback();
    }
  });
};

OutboundManager.prototype.deleteMessage = function(ctx, callback) {
  this.config.deleteMessage(ctx, callback);
};

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
    this.stack.execute('deleteMessage', {
      client: client,
      packet: packet,
      messageId: packet.messageId
    }, function(err){
      if(err) return next(err);
    });
  } else {
    return next();
  }
};

module.exports = OutboundManager;
