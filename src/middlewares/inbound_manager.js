var _ = require('underscore');

/**
 * InboundManager Middleware
 *
 * Manages incomming publish packets.
 */
var InboundManager = function(){};

/**
 * Handles 'publish' messages and executes 'relayMessage'. Sends
 * 'puback' for QoS1 messages.
 *
 * @param client
 * @param packet
 * @param next
 * @param done
 */
InboundManager.prototype.handle = function(client, packet, next, done){
  var self = this;
  if(packet.cmd == 'publish') {
    self.stack.execute('relayMessage',{
      client: client,
      packet: packet,
      topic: packet.topic,
      payload: packet.payload
    }, function(err){
      if(err) return next(err);
      if(packet.qos == 1) {
        client.push({
          cmd: 'puback',
          messageId: packet.messageId
        });
        return done();
      } else {
        return done();
      }
    });
  } else {
    return next();
  }
};

module.exports = InboundManager;
