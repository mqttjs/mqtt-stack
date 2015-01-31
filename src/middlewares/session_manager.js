var _ = require('underscore');
var async = require('async');

/**
 * SessionManager Middleware
 *
 * Manages the clients session and calls callbacks to manage
 * the stored subscriptions for clean and unclean clients.
 *
 * Own Callbacks:
 * - storeSubscription
 * - lookupSubscriptions
 * - clearSubscriptions
 *
 * Dependent Callbacks:
 *  - subscribeTopic
 */
var SessionManager = function(){};

/**
 * Stores subscriptions if the client is unclean.
 *
 * @param ctx
 * @param callback
 */
SessionManager.prototype.subscribeTopic = function(ctx, callback) {
  if(ctx.client._client_id) {
    this.stack.execute('storeSubscription', ctx, callback);
  }
};

/**
 * Checks the clean flag on connect and calls appropriate functions and
 * sets clientId as client._client_id if unclean.
 *
 * @param client
 * @param packet
 * @param next
 */
SessionManager.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'connect') {
    if(packet.clean) {
      client._client_id = packet.clientId;
      this._handleCleanClient(client, packet, next);
    } else {
      client._client_id = false;
      this._handleUncleanClient(client, packet, next);
    }
  } else {
    return next();
  }
};

/**
 * For clean clients executes 'clearSubscriptions' and sends 'connack' with
 * sessionPresent' set to false as there are no subscriptions..
 *
 * @param client
 * @param packet
 * @param next
 * @private
 */
SessionManager.prototype._handleCleanClient = function(client, packet, next) {
  this.stack.execute('clearSubscriptions', {
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
};

/**
 * For unclean clients executes 'lookupSubscriptions' and executes
 * 'subscribeTopic' for each and finally sends a 'connack' with
 * 'sessionPresent' set to true if there are any subscriptions.
 * @param client
 * @param packet
 * @param next
 * @private
 */
SessionManager.prototype._handleUncleanClient = function(client, packet, next) {
  var self = this;

  var store = [];
  this.stack.execute('lookupSubscriptions', {
    client: client,
    packet: packet,
    clientId: packet.clientId
  }, store, function(err){
    if(err) return next(err);

    async.mapSeries(store, function(s, cb){
      self.stack.execute('subscribeTopic', {
        client: client,
        packet: packet,
        topic: s.topic,
        qos: s.qos
      }, cb);
    }, function(err){
      if(err) return next(err);

      client.connack({
        returnCode: 0,
        sessionPresent: (store.length > 0)
      });
    });
  });
};

module.exports = SessionManager;
