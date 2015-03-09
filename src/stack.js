var _ = require('underscore');
var async = require('async');
var stream = require('stream');
var util = require('util');

/**
 * Stack Class
 *
 * Manages a set of middlewares.
 *
 * @param {Function} errorHandler - function that handles all errors
 */
var Stack = function(errorHandler){
  this.middlewares = [];
  this.errorHandler = errorHandler;
};

/**
 * Add a middleware to the stack.
 *
 * @param middleware - and already instantiated middleware or object
 */
Stack.prototype.use = function(middleware) {
  middleware.stack = this;
  this.middlewares.push(middleware);
};



var ProcessStream = function(client, stack) {
  this.client = client;
  this.stack = stack;

  stream.Writable.call(this, {
    objectMode: true
  });
};

util.inherits(ProcessStream, stream.Writable);

ProcessStream.prototype._write = function(chunk, _, done) {
  this.stack.process(this.client, chunk, done);
};




/**
 * Handle a client using the prepared stack.
 *
 * @param client - the client that should be handled
 */
Stack.prototype.handle = function(client) {
  _.each(this.middlewares, function(m){
    if(m.install) {
      m.install(client);
    }
  });

  client._process_stream = new ProcessStream(client, this);
  client.pipe(client._process_stream);
};

/**
 * Run the stack against a client and a single packet. This will be
 * automatically called with data from the underlying stream.
 *
 * @param client - the stream emitted the packet
 * @param packet - the packet that should be handled
 * @param done - to be called on finish
 */
Stack.prototype.process = function(client, packet, done) {
  var self = this;
  var l = this.middlewares.length;
  var i = -1;
  function next(err) {
    if(err) {
      return self.errorHandler(err, client, packet);
    } else {
      i++;
      if(i < l) {
        if(self.middlewares[i].handle) {
          return self.middlewares[i].handle(client, packet, next, done);
        } else {
          return next();
        }
      }
    }
  }
  next();
};

/**
 * Execute a function on all middlewares.
 *
 * @param fn - the name of the function
 * @param [data] - object passed as first argument
 * @param [store] - object passes as second argument (usefull to collect data)
 * @param [callback] - function to be called after finish
 */
Stack.prototype.execute = function(fn, data, store, callback){
  if(typeof store === 'function') {
    callback = store;
    store = null;
  }

  var tasks = [];

  _.each(this.middlewares, function(m){
    if(m[fn]) {
      tasks.push(function(cb){
        if(store) {
          m[fn](data, store, cb);
        } else {
          m[fn](data, cb);
        }
      });
    }
  });

  async.parallel(tasks, callback || function(){});
};

module.exports = Stack;
