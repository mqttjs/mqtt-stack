/**
 * LastWill Middleware
 *
 * - reads lastWill from 'connect' packet
 * - injects the lastWill 'publish' packet when 'uncleanDisconnect' is executed
 *
 * TODO: [MQTT-3.14.1-1] Store will in state and clear it on a 'cleanDisconnect'
 *
 * @example
 * stack.use(new LastWill());
 */

var _ = require('underscore');

var LastWill = function() {};

LastWill.prototype.uncleanDisconnect = function(ctx, callback){
  var self = this;

  if(ctx.client._last_will) {
    var packet = _.defaults(ctx.client._last_will, {
      cmd: 'publish'
    });

    setImmediate(function(){
      self.stack.runStack(ctx.client, packet);
    });
  }

  if(callback) callback();
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
