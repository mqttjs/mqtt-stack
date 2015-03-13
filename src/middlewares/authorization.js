/**
 * Authorization Middleware
 *
 * Authorizes invidual packet types.
 *
 * Enabled callbacks:
 * - authorizePacket
 */

var Authorization = function(){};

/**
 * Executes 'authorizePacket' for every packet and only calls
 * next if authoriztion is valid.
 *
 * @param client
 * @param packet
 * @param next
 * @param done
 */
Authorization.prototype.handle = function(client, packet, next, done) {
  var store = {};
  this.stack.execute('authorizePacket', {
    client: client,
    packet: packet
  }, store, function(err){
    if(err) return next(err);

    if(store.valid) {
      return next();
    } else {
      return done();
    }
  });
};

module.exports = Authorization;
