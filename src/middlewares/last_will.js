var _ = require('underscore');

/**
 * LastWill Middleware
 *
 * - reads lastWill from 'connect' packet
 * - injects the lastWill 'publish' packet on 'uncleanDisconnect'
 *
 * TODO: [MQTT-3.14.1-1] Store will in state and clear it on a 'cleanDisconnect'
 *
 * @example
 * stack.use(new LastWill());
 */

var LastWill = function() {};

LastWill.prototype.install = function(client) {
  var self = this;

  client.on('uncleanDisconnect', function(){
    if(client._last_will) {
      var packet = _.defaults(client._last_will, {
        cmd: 'publish'
      });

      setImmediate(function(){
        self.stack.runStack(client, packet);
      });
    }
  });
};

LastWill.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'connect') {
    if(packet.will) {
      client._last_will = packet.will;
    }
  }
  next();
};

module.exports = LastWill;
