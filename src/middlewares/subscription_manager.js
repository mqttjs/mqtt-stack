var _ = require('underscore');

/**
 * SubscriptionManager Middleware
 *
 * - handles 'subscribe' packet
 * - handles 'unsubscribe' packets
 * - executes 'subscribeTopic' and 'unsubscribeTopic'
 *
 * TODO: Support QoS2
 * TODO: Forward retained messages for new subscriptions.
 * TODO: Forward messages according to the subscriptions and messages max QoS.
 * TODO: On Unsubscribe ensure that all QoS1 and QoS2 get completed
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new SubscriptionManager({
 *   subscribeTopic: function(ctx, callback) {
 *     // make subscription
 *     callback(ctx.qos);
 *   },
 *   unsubscribeTopic: function(ctx, callback) {
 *     // make unsubscription
 *     callback();
 *   }
 * }));
 */

var SubscriptionManager = function(config){
  this.config = _.defaults(config || {}, {
    subscribeTopic: function(ctx, callback) {
      callback(ctx.qos);
    },
    unsubscribeTopic: function(ctx, callback) {
      callback();
    }
  });
};

SubscriptionManager.prototype.subscribeTopic = function(ctx, callback) {
  this.config.subscribeTopic(ctx, callback);
};

SubscriptionManager.prototype.unsubscribeTopic = function(ctx, callback) {
  this.config.unsubscribeTopic(ctx, callback);
};

SubscriptionManager.prototype.handle = function(client, packet, next){
  var self = this;
  if(packet.cmd == 'subscribe') {
    var granted = [];
    _.each(packet.subscriptions, function(s) {
      self.stack.execute('subscribeTopic', {
        client: client,
        packet: packet,
        topic: s.topic,
        qos: s.qos
      }, function(err, results){
        if(err) return next(err);

        var grant = Math.min.apply(null, _.flatten(results));
        granted.push(grant === false ? 128 : Math.min(grant, 1));
        if(granted.length == packet.subscriptions.length) {
          return client.suback({
            messageId: packet.messageId,
            granted: granted
          });
        }
      });
    });
  } else if(packet.cmd == 'unsubscribe') {
    var i = 0;
    _.each(packet.unsubscriptions, function(us){
      self.stack.execute('unsubscribeTopic', {
        client: client,
        packet: packet,
        topic: us
      }, function(err){
        i++;
        if(err) return next(err);
        if(packet.unsubscriptions.length == i) {
          return client.unsuback({
            messageId: packet.messageId
          });
        }
      });
    });
  } else {
    return next();
  }
};

module.exports = SubscriptionManager;
