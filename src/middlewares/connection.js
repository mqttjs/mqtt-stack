var _ = require('underscore');

/**
 * Connection Middleware
 *
 * - closes client if first packet is not a 'connect' packet
 * - closes client and emits 'uncleanDisconnect' if connect gets received more than once
 * - closes client on 'disconnect' and emits 'cleanDisconnect'
 * - closes client on 'error' and emits 'uncleanDisconnect'
 * - emits 'uncleanDisconnect' on 'close' without a previous 'disconnect' packet
 * - manages the client._dead flag
 * - forces proper mqtt protocol version and Id if enabled (forceMQTT4)
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new Connection({
 *   forceMQTT4: true
 * }));
 */

var Connection = function(config) {
  this.config = _.defaults(config || {}, {
    forceMQTT4: false
  });
};

Connection.prototype.install = function(client) {
  client._sent_first = false;
  client._sent_disconnect = false;
  client._dead = false;

  client.on('error', function(){
    if(!client._sent_disconnect) {
      client._dead = true;
      client.destroy();
      client.emit('uncleanDisconnect');
    }
  });
  client.on('close', function(){
    if(!client._sent_disconnect) {
      client._dead = true;
      client.emit('uncleanDisconnect');
    }
  });
};

Connection.prototype.handle = function(client, packet, next) {
  if(!client._sent_first) {
    client._sent_first = true;
    if(packet.cmd == 'connect') {
      if(this.config.forceMQTT4 && (packet.protocolVersion !== 4 || packet.protocolId !== 'MQTT')) {
        client._dead = true;
        return client.destroy();
      } else {
        return next();
      }
    } else {
      client._dead = true;
      return client.destroy();
    }
  } else {
    if(packet.cmd == 'connect') {
      client._dead = true;
      client.destroy();
      return client.emit('uncleanDisconnect');
    } else if(packet.cmd == 'disconnect') {
      client._sent_disconnect = true;
      client._dead = true;
      client.destroy();
      return client.emit('cleanDisconnect');
    } else {
      return next();
    }
  }
};

module.exports = Connection;
