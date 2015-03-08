var _ = require('underscore');
var async = require('async');

/**
 * SubscriptionManager Middleware
 *
 * Handles sunscription and unsubscriptions.
 *
 * Enabled callbacks:
 * - subscribeTopic
 * - unsubscribeTopic
 *
 * TODO: Forward messages according to the subscriptions and messages max QoS.
 * TODO: On Unsubscribe ensure that all QoS1 and QoS2 get completed
 */
var SubscriptionManager = function(){};

/**
 * Handles 'subscribe' and 'unsubscribe' packets.
 *
 * @param client
 * @param packet
 * @param next
 * @param done
 */
SubscriptionManager.prototype.handle = function(client, packet, next, done){
  if(packet.cmd == 'subscribe') {
    this._handleSubscription(client, packet, next, done);
  } else if(packet.cmd == 'unsubscribe') {
    this._handleUnsubscription(client, packet, next, done);
  } else {
    return next();
  }
};

/**
 * Executes 'subscribeTopic' for each individual subscription and sends a 'suback'.
 * The callback can change the granted subscription by editing 'store.grant'.
 *
 * @param client
 * @param packet
 * @param next
 * @private
 */
SubscriptionManager.prototype._handleSubscription = function(client, packet, next, done) {
  var self = this;
  async.mapSeries(packet.subscriptions, function(s, cb){
    var store = { grant: s.qos };
    self.stack.execute('subscribeTopic', {
      client: client,
      packet: packet,
      topic: s.topic,
      qos: s.qos
    }, store, function(err){
      if(err) return cb(err);

      cb(null, store.grant === false ? 128 : store.grant);
    });
  }, function(err, results){
    if(err) return next(err);

    client.suback({
      messageId: packet.messageId,
      granted: results
    });

    return done();
  });
};

/**
 * Executes 'unsubscribeTopic' for each individual unsubscription and sends the 'unsuback'.
 *
 * @param client
 * @param packet
 * @param next
 * @private
 */
SubscriptionManager.prototype._handleUnsubscription = function(client, packet, next, done) {
  var self = this;
  async.mapSeries(packet.unsubscriptions, function(us, cb){
    self.stack.execute('unsubscribeTopic', {
      client: client,
      packet: packet,
      topic: us
    }, cb);
  }, function(err){
    if(err) return next(err);

    client.unsuback({
      messageId: packet.messageId
    });

    return done();
  });
};

module.exports = SubscriptionManager;
