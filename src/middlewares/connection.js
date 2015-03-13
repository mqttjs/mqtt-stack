var _ = require('underscore');
var crypto = require('crypto');

/**
 * Connection Middleware
 *
 * Manages the basic connection.
 *
 * Enabled callbacks:
 * - closeClient
 * - uncleanDisconnect
 * - cleanDisconnect
 *
 * @param config.forceMQTT4 - enable to force newest protocol
 */
var Connection = function(config) {
  this.config = _.defaults(config || {}, {
    forceMQTT4: false
  });
};

/**
 * Execute to immediately close the client and execute
 * 'uncleanDisconnect' right after.
 *
 * @param ctx
 * @param callback
 */
Connection.prototype.closeClient = function(ctx, callback){
  ctx.client.close();
  this.stack.execute('uncleanDisconnect', ctx, callback);
};

/**
 * Will execute 'uncleanDisconnect' on 'close' and 'error'
 *
 * - closes client on 'error' and executes 'uncleanDisconnect'
 * - executes 'uncleanDisconnect' on 'close' without a previous 'disconnect' packet
 *
 * @param client
 */
Connection.prototype.install = function(client) {
  var self = this;

  client._sent_first = false;
  client._sent_disconnect = false;

  client.on('error', function(){
    client.close();
    if(!client._sent_disconnect) {
      return self.stack.execute('uncleanDisconnect', {
        client: client
      });
    }
  });
  client.on('close', function(){
    client.close();
    if(!client._sent_disconnect) {
      return self.stack.execute('uncleanDisconnect', {
        client: client
      });
    }
  });
};

/**
 * Handles 'connect' and 'disconnet' packets.
 *
 * - closes client if first packet is not a 'connect' packet
 * - closes client if clientID is empty and clean = false
 * - closes client and executes 'uncleanDisconnect' if connect gets received more than once
 * - closes client on 'disconnect' and executes 'cleanDisconnect'
 * - assigns a unique client_id when id is missing
 * - forces proper mqtt protocol version and Id if enabled (forceMQTT4)
 *
 * @param client
 * @param packet
 * @param next
 * @param done
 */
Connection.prototype.handle = function(client, packet, next, done) {
  var self = this;
  if(!client._sent_first) {
    client._sent_first = true;
    if(packet.cmd == 'connect') {
      if(this.config.forceMQTT4 && (packet.protocolVersion !== 4 || packet.protocolId !== 'MQTT')) {
        client.close();
        return done();
      } else if((!packet.clientId || packet.clientId.length === 0) && packet.clean === false) {
        client.close();
        return done();
      } else {
        if(!packet.clientId || packet.clientId.length === 0) {
          packet.clientId = crypto.randomBytes(16).toString('hex');
        }
        return next();
      }
    } else {
      client.close();
      return done();
    }
  } else {
    if(packet.cmd == 'connect') {
      client.close();
      return self.stack.execute('uncleanDisconnect', {
        client: client
      }, done);
    } else if(packet.cmd == 'disconnect') {
      client._sent_disconnect = true;
      client.close();
      return self.stack.execute('cleanDisconnect', {
        client: client
      }, done);
    } else {
      return next();
    }
  }
};

module.exports = Connection;
