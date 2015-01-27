/**
 * Authorization Middleware
 *
 * - authorizes packets using the provided functions,
 *   dismisses packets if authorization fails
 *
 * @param {Object} config
 *
 * @example
 * stack.use(new Authorization({
 *   publish: function(ctx, callback){
 *     callback(null, !!ctx.packet.topic.match(/hello/g);
 *   }
 * }));
 */

var Authorization = function(config){
  this.config = config;
};

Authorization.prototype.handle = function(client, packet, next) {
  var callback = this.config[packet.cmd];
  if(callback) {
    callback({
      client: client,
      packet: packet
    }, function(err, valid){
      if(err) return next(err);
      if(valid) {
        return next();
      }
    });
  } else {
    return next();
  }
};

module.exports = Authorization;
