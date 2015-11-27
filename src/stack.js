"use strict";
let Client = require('./client');

function noop() {}

/**
 * Stack Class
 *
 * Manages a set of middlewares.
 */
class Stack {
    /**
     * constructor
     *
     * @param {Function} errorHandler - function that handles all errors
     */
    constructor(errorHandler) {
        this.middlewares = [];
        this.errorHandler = errorHandler || function (err) {
                throw err;
            };
    }

    /**
     * Add a middleware to the stack.
     *
     * @param middleware - and already instantiated middleware or object
     */
    use(middleware) {
        middleware.stack = this;
        this.middlewares.push(middleware);
    }

    /**
     * Generates handler that takes streams as an input.
     *
     * @returns {Function}
     */
    handler() {
        let self = this;

        return function (stream) {
            new Client(self, stream);
        }
    }

    /**
     * Install a client on all middlewares.
     *
     * @param client - the client that should be installed
     */
    install(client) {
        this.middlewares.forEach(function (middleware) {
            if (middleware.install) {
                middleware.install(client);
            }
        });
    }

    /**
     * Run the stack against a client and a single packet. This will be
     * automatically called with data from the underlying stream.
     *
     * The errorHandler gets called with any error ocurring in between.
     *
     * @param client - the stream emitted the packet
     * @param packet - the packet that should be handled
     * @param done - to be called on finish
     */
    process(client, packet, done) {
        let self = this;

        let l = this.middlewares.length;
        let i = -1;

        function next(err) {
            if (err) {
                return self.errorHandler(err, client, packet);
            } else {
                i++;
                if (i < l) {
                    if(self.middlewares[i].handle) {
                        return self.middlewares[i].handle(client, packet, next, (done || noop));
                    }
                    else {
                        return next();
                    }
                }
                else {
                    return (done || noop)();
                }
            }
        }

        next();
    }

    /**
     * Execute a function on all middlewares.
     *
     * @param fn - the name of the function
     * @param [data] - object passed as first argument
     * @param [store] - object passed as second argument (useful to collect data)
     * @param [callback] - function to be called after finish unless there is an error
     */
    execute(fn, data, store, callback) {
        let self = this;

        if (typeof store === 'function') {
            callback = store;
            store = null;
        }

        let l = this.middlewares.length;
        let i = -1;

        function next(err) {
            if (err) {
                return (callback || noop)(err);
            } else {
                i++;
                if (i < l) {
                    if (self.middlewares[i][fn]) {
                        return self.middlewares[i][fn](data, store, next, callback);
                    } else {
                        return next();
                    }
                } else {
                    return (callback || noop)();
                }
            }
        }

        next();
    }
}

module.exports = Stack;
