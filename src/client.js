"use strict";
let mqtt = require('mqtt-packet');
let EventEmitter = require('events').EventEmitter;

/**
 * Client Class
 *
 * Represents a connected client.
 */
class Client extends EventEmitter {
    /**
     * constructor
     *
     * @param stack
     * @param stream
     * @constructor
     */
    constructor(stack, stream) {
        super();
        let self = this;

        this.stack = stack;
        this.stream = stream;
        this._parser = mqtt.parser();
        this._workload = 1;
        this._dead = false;

        this.stack.install(this);

        stream.on('readable', self._work.bind(self));
        stream.on('error', this.emit.bind(this, 'error'));
        stream.on('close', this.emit.bind(this, 'close'));



        this._parser.on('packet', function (packet) {
            self._workload++;
            stack.process(self, packet, self._work.bind(self));
        });

        this._parser.on('error', this.emit.bind(this, 'error'));

        this._work();
    }

    /**
     * Work on incomming packets.
     *
     * @private
     */
    _work() {
        this._workload--;

        if (this._workload <= 0) {
            this._workload = 0;
            let chunk = this.stream.read();

            if (chunk) {
                this._parser.parse(chunk);
            }
        }
    }

    /**
     * Write data to the clients stream.
     *
     * @param packet
     * @param done
     */
    write(packet, done) {
        if (!this._dead) {
            if(mqtt.writeToStream(packet, this.stream)) {
                setImmediate(done);
            }
            else {
                this.stream.once('drain', done);
            }
        }
    }

    /**
     * Close the connection
     *
     * @param done
     */
    close(done) {
        this._dead = true;

        if (this.stream.destroy) {
            this.stream.destroy(done);
        } else {
            this.stream.end(done);
        }
    }
}

module.exports = Client;
