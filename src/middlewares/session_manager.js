var _ = require('underscore');
var async = require('async');

/**
 * SessionManager Middleware
 *
 * Manages the clients session and calls callbacks to manage
 * the stored subscriptions for clean and unclean clients.
 *
 * Enabled Callbacks:
 * - storeSubscription
 * - lookupSubscriptions
 * - clearSubscriptions
 *
 * Required Callbacks:
 *  - subscribeTopic
 */
var SessionManager = function(){};

/**
 * Stores subscriptions if the client is unclean.
 *
 * @param ctx
 * @param store
 * @param callback
 */
SessionManager.prototype.subscribeTopic = function(ctx, store, callback) {
  if(ctx.client._managed_session) {
    this.stack.execute('storeSubscription', ctx, callback);
  } else {
    callback();
  }
};

/**
 * Checks the clean flag on connect and calls appropriate functions and
 * sets clientId as client._client_id if unclean.
 *
 * @param client
 * @param packet
 * @param next
 * @param done
 */
SessionManager.prototype.handle = function(client, packet, next, done) {
  if(packet.cmd == 'connect') {
    client._client_id = packet.clientId;
    if(packet.clean) {
      client._managed_session = false;
      this._handleCleanClient(client, packet, next, done);
    } else {
      client._managed_session = true;
      this._handleUncleanClient(client, packet, next, done);
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
 * @param done
 * @private
 */
SessionManager.prototype._handleCleanClient = function(client, packet, next, done) {
  this.stack.execute('clearSubscriptions', {
    client: client,
    packet: packet,
    clientId: packet.clientId
  }, function(err){
    if(err) return next(err);

    client.write({
      cmd: 'connack',
      returnCode: 0,
      sessionPresent: false
    });

    return done();
  });
};

/**
 * For unclean clients executes 'lookupSubscriptions' and executes
 * 'subscribeTopic' for each and finally sends a 'connack' with
 * 'sessionPresent' set to true if there are any subscriptions.
 * @param client
 * @param packet
 * @param next
 * @param done
 * @private
 */
SessionManager.prototype._handleUncleanClient = function(client, packet, next, done) {
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
      }, {}, cb);
    }, function(err){
      if(err) return next(err);

      client.write({
        cmd: 'connack',
        returnCode: 0,
        sessionPresent: (store.length > 0)
      });

      return done();
    });
  });
};

module.exports = SessionManager;
