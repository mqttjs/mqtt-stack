var _ = require('underscore');

/**
 * InboundManager Middleware
 *
 * - relays messages published by the client
 * - handles 'puback' in QoS1 flow
 *
 * TODO: Storing and deleting of messages
 * TODO: QoS2 support
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new InboundManager({
 *   storeMessage: function(ctx, callback) {
 *     database.put(ctx.packet);
 *   },
 *   relayMessage: function(ctx, callback) {
 *     cluster.relay(ctx.packet);
 *   }
 * }));
 */

var InboundManager = function(config){
  this.config = _.defaults(config || {}, {
    storeMessage: function(ctx, callback) {
      callback();
    },
    relayMessage: function(ctx, callback) {
      callback();
    }
  });
};

InboundManager.prototype.handle = function(client, packet, next){
  var self = this;
  if(packet.cmd == 'publish') {
    this.config.storeMessage({
      client: client,
      packet: packet,
      topic: packet.topic,
      payload: packet.payload
    }, function(err){
      if(err) return next(err);
      self.config.relayMessage({
        client: client,
        packet: packet,
        topic: packet.topic,
        payload: packet.payload
      }, function(err){
        if(err) return next(err);
        if(packet.qos == 1) {
          client.puback({
            messageId: packet.messageId
          });
        }
      });
    });
  } else {
    return next();
  }
};

module.exports = InboundManager;
