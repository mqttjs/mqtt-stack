var _ = require('underscore');

/**
 * LastWill Middleware
 *
 * Manages will packet.
 *
 * Required callbacks:
 *  - uncleanDisconnect
 */
var LastWill = function() {};

/**
 * Injects will packet if availabe on 'uncleanDisconnect'.
 *
 * @param ctx
 */
LastWill.prototype.uncleanDisconnect = function(ctx, cb){
  var self = this;

  if(ctx.client._last_will) {
    var packet = _.defaults(ctx.client._last_will, {
      cmd: 'publish'
    });

    setImmediate(function(){
      self.stack.process(ctx.client, packet, function(){});
    });

    cb();
  }
};

/**
 * Looks for a will packet and stores it.
 *
 * @param client
 * @param packet
 * @param next
 */
LastWill.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'connect') {
    if(packet.will) {
      client._last_will = packet.will;
    }
  }

  return next();
};

module.exports = LastWill;
