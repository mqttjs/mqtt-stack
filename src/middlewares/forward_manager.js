var _ = require('underscore');

/**
 * ForwardManager Middleware
 *
 * - forwards messages emitted to 'forwardMessage' to the client
 * - handles 'puback' in QoS1 flow
 *
 * TODO: Storing and deleting messages
 * TODO: QoS2 support
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new ForwardManager());
 */

var ForwardManager = function(config){
  this.config = _.defaults(config || {}, {
    deleteMessage: function(ctx, callback){
      callback();
    }
  });
};

ForwardManager.prototype.install = function(client) {
  client.on('forwardMessage', function(packet){
    client.publish({
      topic: packet.topic,
      payload: packet.payload,
      qos: packet.qos,
      messageId: Math.random()*60000
    });
  });
};

ForwardManager.prototype.handle = function(client, packet, next){
  if(packet.cmd == 'puback') {
    this.config.deleteMessage({
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

module.exports = ForwardManager;
