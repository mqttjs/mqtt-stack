var _ = require('underscore');
var async = require('async');

/**
 * RetainManager Middleware
 *
 * - executes "storeRetainedMessage" for retained messages and resets flag
 * - lookups retained messages on "subscribeTopic" and executes "forwardMessage"
 */
var RetainManager = function(){};

/**
 * Checks for every subscription if there are any retained messages. Executes
 * 'lookupRetainedMessages' and 'forwardMessage' with each result.
 *
 * @param ctx
 * @param _
 * @param callback
 */
RetainManager.prototype.subscribeTopic = function(ctx, _, callback) {
  var self = this;

  var store = [];
  this.stack.execute('lookupRetainedMessages', {
    client: ctx.client,
    topic: ctx.topic
  }, store, function(err){
    if(err) callback(err);

    if(store.length > 0) {
      return async.mapSeries(store, function(p, cb){
        return self.stack.execute('forwardMessage', {
          client: ctx.client,
          packet: p
        }, cb);
      }, callback);
    } else {
      return callback();
    }
  });
};

/**
 * Checks for retained publish packets, stores them and clears retained flag.
 * Executes 'storeRetainedMessage'.
 *
 * @param client
 * @param packet
 * @param next
 */
RetainManager.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'publish') {
    if(packet.retain) {
      var p = _.clone(packet);
      packet.retain = false;

      return this.stack.execute('storeRetainedMessage', {
        client: client,
        packet: p,
        topic: p.topic
      }, next);
    } else {
      return next();
    }
  } else {
    return next();
  }
};

module.exports = RetainManager;
