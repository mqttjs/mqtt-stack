/**
 * Authentication Middleware
 *
 * - calls authentication callback for every 'connect' until
 *   the client has been succesfully authenticated
 * - sends 'connack' with 'returnCode: 4' and dismisses packet if
 *   authentication fails
 *
 * @param {function} authenticationCallback
 *
 * @example
 * stack.use(new Authentication(function(ctx, callback){
 *   callback(null, ctx.username == 'root' && ctx.password == 'root');
 * });
 */

var Authentication = function(authenticationCallback){
  this.authenticationCallback = authenticationCallback;
};

Authentication.prototype.install = function(client){
  client._authenticated = false;
};

Authentication.prototype.handle = function(client, packet, next) {
  if(packet.cmd == 'connect') {
    if(!client._authenticated) {
      this.authenticationCallback({
        client: client,
        packet: packet,
        username: packet.username,
        password: packet.password
      }, function(err, valid){
        if(err) return next(err);
        if(valid) {
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
