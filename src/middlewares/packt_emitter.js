/**
 * PacketEmitter Middleware
 *
 * - calls the clientHandler with every client
 * - emits all packets as events on the client
 *
 * @param {function} clientHandler
 *
 * @example
 * stack.use(new PacketEmitter(function(client){
 *   client.on('publish', function(){
 *     // do something
 *   });
 * }));
 */

var PacketEmitter = function(clientHandler){
  this.clientHandler = clientHandler;
};

PacketEmitter.prototype.install = function(client) {
  this.clientHandler(client);
};

PacketEmitter.prototype.handle = function(client, packet) {
  client.emit(packet.cmd, packet);
};

module.exports = PacketEmitter;
