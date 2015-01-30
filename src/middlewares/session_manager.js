var _ = require('underscore');

/**
 * SessionManager Middleware
 *
 * - manages the clients session
 * - executes 'newSession', 'resumeSession' and 'storeSession'
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

SessionManager.prototype.newSession = function(ctx, callback) {
  this.config.newSession(ctx, callback);
};

SessionManager.prototype.resumeSession = function(ctx, callback) {
  this.config.resumeSession(ctx, callback);
};

SessionManager.prototype.storeSession = function(ctx, callback) {
  this.config.storeSession(ctx, callback);
};

SessionManager.prototype.cleanDisconnect = function(ctx, callback) {
  if(ctx.client._managed_session) {
    this.stack.execute('storeSession', ctx, callback);
  } else {
    if(callback) callback();
  }
};

SessionManager.prototype.uncleanDisconnect = function(ctx, callback) {
  if(ctx.client._managed_session) {
    this.stack.execute('storeSession', ctx, callback);
  } else {
    if(callback) callback();
  }
};

SessionManager.prototype.handle = function(client, packet, next) {
  var self = this;
  if(packet.cmd == 'connect') {
    if(packet.clean) {
      client._managed_session = false;
      this.stack.execute('newSession', {
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
      client._managed_session = true;
      self.stack.execute('resumeSession', {
        client: client,
        packet: packet,
        clientId: packet.clientId
      }, function(err, resumed){
        if(err) return next(err);
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
