var _ = require('underscore');

var Timer = require('../utils/timer');

/**
 * KeepAlive Middleware
 *
 * TODO: add min and max values for client keepalive?
 * TODO: flag to discard 0 keepalive?
 *
 * Required callbacks:
 * - closeClient
 *
 * @param config.defaultTimeout - the default timeout
 * @param config.grace - the grace to be allowed
 */
var KeepAlive = function(config){
  this.config = _.defaults(config || {}, {
    defaultTimeout: 30,
    grace: 2
  })
};

/**
 * Starts the default timer and executes 'closeClient' on no activity.
 *
 * @param client
 */
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

/**
 * Starts timer with settings read from 'connect' packet,
 * resets timer on any client activity, handles and
 * dismisses 'pingreq' packets, executes 'closeClient'
 * if client misses a ping
 *
 * @param client
 * @param packet
 * @param next
 */
KeepAlive.prototype.handle = function(client, packet, next) {
  var self = this;
  if(packet.cmd == 'connect') {
    if(client._keep_alive_timer) {
      client._keep_alive_timer.clear();
    }
    var timeout = packet.keepalive * 1000 * this.config.grace;
    client._keep_alive_timer = new Timer(timeout, function(){
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
