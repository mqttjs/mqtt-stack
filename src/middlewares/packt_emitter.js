/**
 * PacketEmitter Middleware
 *
 * Enables legacy handling of clients with events.
 *
 * @param {function} clientHandler
 */
var PacketEmitter = function(clientHandler){
  this.clientHandler = clientHandler;
};

/**
 * Passes the client to the 'clientHandler'
 *
 * @param client
 */
PacketEmitter.prototype.install = function(client) {
  this.clientHandler(client);
};

/**
 * Emits packet as event.
 *
 * @param client
 * @param packet
 */
PacketEmitter.prototype.handle = function(client, packet) {
  client.emit(packet.cmd, packet);
};

module.exports = PacketEmitter;
