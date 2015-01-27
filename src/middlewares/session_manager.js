var _ = require('underscore');

/**
 * SessionManager Middleware
 *
 * - manages the clients session
 *
 * TODO: [MQTT-3.1.4-2] disconnect connected clients using the same clientId
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new SessionManager({
 *   newSession: function(ctx, callback) {
 *     // create session
 *     callback();
 *   },
 *   resumeSession: function(ctx, callback) {
 *     // lookup session
 *     callback(null, true);
 *   },
 *   storeSession: function(ctx, callback) {
 *     // save session
 *     callback();
 *   }
 * }));
 */

var SessionManager = function(config){
  this.config = _.defaults(config || {}, {
    newSession: function(ctx, callback) {
      callback();
    },
    resumeSession: function(ctx, callback) {
      callback(null, false);
    },
    storeSession: function(ctx, callback) {
      callback();
    }
  })
};

SessionManager.prototype.handle = function(client, packet, next) {
  var self = this;
  if(packet.cmd == 'connect') {
    if(packet.clean) {
      this.config.newSession({
        client: client,
        packet: packet,
        clientId: packet.clientId
      }, function(err){
        if(err) return next(err);
        client.connack({
          returnCode: 0,
          sessionPresent: false
        });
      });
    } else {
      this.config.resumeSession({
        client: client,
        packet: packet,
        clientId: packet.clientId
      }, function(err, resumed){
        if(err) return next(err);
        client.on('cleanDisconnect', function(){
          self.config.storeSession(client, function(){
            if(err) return next(err);
          });
        });
        client.on('uncleanDisconnect', function(){
          self.config.storeSession(client, function(){
            if(err) return next(err);
          });
        });
        client.connack({
          returnCode: 0,
          sessionPresent: resumed
        });
      });
    }
  } else {
    return next();
  }
};

module.exports = SessionManager;
