var mqtt = require('mqtt-packet');
var EE = require('events').EventEmitter;
var util  = require('util');

/**
 * Client Class
 *
 * Represents a connected client.
 *
 * @param stack
 * @param stream
 * @constructor
 */
function Client(stack, stream) {
  var self = this;

  this.stack = stack;
  this.stream = stream;
  this._parser = mqtt.parser();
  this._workload = 1;
  this._dead = false;

  this.stack.install(this);

  stream.on('readable', self._work.bind(self));
  stream.on('error', this.emit.bind(this, 'error'));
  stream.on('close', this.emit.bind(this, 'close'));

  this._parser.on('packet', function(packet){
    self._workload++;
    stack.process(self, packet, self._work.bind(self));
  });

  this._parser.on('error', this.emit.bind(this, 'error'));

  this._work();
}

util.inherits(Client, EE);

/**
 * Work on incomming packets.
 *
 * @private
 */
Client.prototype._work = function(){
  this._workload--;

  if(this._workload <= 0) {
    this._workload = 0;
    var chunk = this.stream.read();

    if(chunk) {
      this._parser.parse(chunk);
    }
  }
};

/**
 * Write data to the clients stream.
 *
 * @param packet
 * @param done
 */
Client.prototype.write = function(packet, done) {
  if(!this._dead) {
    this.stream.write(mqtt.generate(packet), 'binary', done)
  }
};

/**
 * Close the connection
 *
 * @param done
 */
Client.prototype.close = function(done) {
  this._dead = true;

  if(this.stream.destroy) {
    this.stream.destroy();
  } else {
    this.stream.end();
  }

  if(done) done();
};

module.exports = Client;
