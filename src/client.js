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
  this.parser = mqtt.parser();
  this.workload = 1;

  this.stack.install(this);

  stream.on('readable', self.work.bind(self));
  stream.on('error', this.emit.bind(this, 'error'));
  stream.on('close', this.emit.bind(this, 'close'));

  this.parser.on('packet', function(packet){
    self.workload++;
    stack.process(self, packet, self.work.bind(self));
  });

  this.parser.on('error', this.emit.bind(this, 'error'));

  this.work();
}

util.inherits(Client, EE);

/**
 * Work in incomming packets.
 */
Client.prototype.work = function(){
  this.workload--;

  if(this.workload <= 0) {
    this.workload = 0;
    var chunk = this.stream.read();

    if(chunk) {
      this.parser.parse(chunk);
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
  this.stream.write(mqtt.generate(packet), 'binary', done)
};

/**
 * Close the connection
 *
 * @param done
 */
Client.prototype.close = function(done) {
  if(this.stream.destroy) {
    this.stream.destroy();
  } else {
    this.stream.end();
  }

  if(done) done();
};

module.exports = Client;
