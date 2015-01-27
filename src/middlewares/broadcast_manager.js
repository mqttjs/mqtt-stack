var _ = require('underscore');

/**
 * BroadcastManager Middleware
 *
 * - broadcast messages published by the client
 * - handles 'puback' in QoS1 flow
 *
 * TODO: Storing and deleting of messages
 * TODO: QoS2 support
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new PublishManager({
 *   storeMessage: function(ctx, callback) {
 *     database.put(ctx.packet);
 *   },
 *   broadcastMessage: function(ctx, callback) {
 *     cluster.relay(ctx.packet);
 *   }
 * }));
 */

var PublishManager = function(config){
  this.config = _.defaults(config || {}, {
    storeMessage: function(ctx, callback) {
      callback();
    },
    broadcastMessage: function(ctx, callback) {
      callback();
    }
  });
};

PublishManager.prototype.handle = function(client, packet, next){
  var self = this;
  if(packet.cmd == 'publish') {
    this.config.storeMessage({
      client: client,
      packet: packet,
      topic: packet.topic,
      payload: packet.payload
    }, function(err){
      if(err) return next(err);
      self.config.broadcastMessage({
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

module.exports = PublishManager;
