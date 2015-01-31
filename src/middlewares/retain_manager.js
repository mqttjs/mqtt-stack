/**
 * RetainManager Middleware
 *
 * - executes "storeRetainedMessage" for retained messages and resets flag
 * - lookups retained messages on "subscribeTopic" and executes "forwardMessage"
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new RetainManager({
 *   storeRetainedMessage: function(ctx, callback) {
 *     // store retained message (topic, payload, qos)
 *   },
 *   lookupRetainedMessages: function(ctx, callback) {
 *     // lookup retained messages (topic, payload, qos)
 *   }
 * }));
 */

var _ = require('underscore');

var RetainManager = function(config){
  this.config = _.defaults(config || {}, {
    storeRetainedMessage: function(ctx, callback){
      if(callback) callback();
    },
    lookupRetainedMessages: function(ctx, callback){
      callback(null, []);
    }
  });
};

RetainManager.prototype.storeRetainedMessage = function(ctx, callback){
  this.config.storeRetainedMessage(ctx, callback);
};

RetainManager.prototype.lookupRetainedMessages = function(ctx, callback){
  this.config.lookupRetainedMessages(ctx, callback);
};

RetainManager.prototype.subscribeTopic = function(ctx, callback) {
  var self = this;
  this.stack.execute('lookupRetainedMessages', {
    client: ctx.client,
    topic: ctx.topic
  }, function(err, results){
    if(err) callback(err);

    _.each(_.flatten(results), function(p){
      self.stack.execute('forwardMessage', {
        client: ctx.client,
        packet: p
      });
    });

    callback();
  });
};

RetainManager.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'publish') {
    if(packet.retain) {
      var p = _.clone(packet);
      this.stack.execute('storeRetainedMessage', {
        client: client,
        packet: p,
        topic: p.topic
      });
    }
    packet.retain = false;
  }
  next();
};

module.exports = RetainManager;
