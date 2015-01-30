var _ = require('underscore');

var Timer = require('../utils/timer');

/**
 * KeepAlive Middleware
 *
 * - starts an configurable default timer
 * - starts timer with settings read from 'connect' packet
 * - resets timer on any client activity
 * - handles and dismisses 'pingreq' packets
 * - executes 'closeClient' if client misses a ping
 *
 * TODO: add min and max values for client keepalive?
 * TODO: flag to discard 0 keepalive?
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new KeepAlive({
 *   defaultTimeout: 60
 * }));
 */

var KeepAlive = function(config){
  this.config = _.defaults(config, {
    defaultTimeout: 30
  })
};

KeepAlive.prototype.install = function(client) {
  var self = this;
  if(this.config.defaultTimeout) {
    client._keep_alive_timer = new Timer(this.config.defaultTimeout * 1000, function(){
      return self.stack.execute('closeClient', {
        client: client
      });
    });
  }
};

KeepAlive.prototype.handle = function(client, packet, next) {
  var self = this;
  if(packet.cmd == 'connect') {
    if(client._keep_alive_timer) {
      client._keep_alive_timer.clear();
    }
    client._keep_alive_timer = new Timer(packet.keepalive * 2000, function(){
      return self.stack.execute('closeClient', {
        client: client
      });
    });
    return next();
  } else {
    if(client._keep_alive_timer) {
      client._keep_alive_timer.reset();
    }
    if(packet.cmd == 'pingreq') {
      return client.pingresp();
    }
    return next();
  }
};

module.exports = KeepAlive;
