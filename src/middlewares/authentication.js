/**
 * Authentication Middleware
 *
 * Manges connection level authentication.
 *
 * Enabled callbacks:
 * - authenticateConnection
 */

var Authentication = function(){};

/**
 * Flags all clients as not authenticated first.
 * @param client
 */
Authentication.prototype.install = function(client){
  client._authenticated = false;
};

/**
 * Executes 'authenticateConnection' for every new 'connect'. Sends
 * 'connack' with 'returnCode: 4' and dismisses packet if authentication
 * fails
 *
 * @param client
 * @param packet
 * @param next
 */
Authentication.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'connect') {
    if(!client._authenticated) {
      var store = {};
      this.stack.execute('authenticateConnection', {
        client: client,
        packet: packet,
        username: packet.username,
        password: packet.password
      }, store, function(err){
        if(err) return next(err);
        if(store.valid) {
          client._authenticated = true;
          return next();
        } else {
          return client.connack({
            returnCode: 4
          });
        }
      });
    }
  } else {
    return next();
  }
};

module.exports = Authentication;
