var _ = require('underscore');
var stream = require('stream');

var Client = require('./client');

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

/**
 * Generates handler that takes streams as an input.
 *
 * @returns {Function}
 */
Stack.prototype.handler = function(){
  var self = this;

  return function(stream) {
    new Client(self, stream);
  }
};

/**
 * Install a client on all middlewares.
 *
 * @param client - the client that should be installed
 */
Stack.prototype.install = function(client) {
  _.each(this.middlewares, function(m){
    if(m.install) {
      m.install(client);
    }
  });
};

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
 * @param [store] - object passed as second argument (usefull to collect data)
 * @param [callback] - function to be called after finish unless there is an error
 */
Stack.prototype.execute = function(fn, data, store, callback){
  var self = this;

  if(typeof store === 'function') {
    callback = store;
    store = null;
  }

  var l = this.middlewares.length;
  var i = -1;

  function next(err) {
    if(err) {
      return callback(err);
    } else {
      i++;
      if(i < l) {
        if(self.middlewares[i][fn]) {
          if(store) {
            return self.middlewares[i][fn](data, store, next);
          } else {
            return self.middlewares[i][fn](data, next);
          }
        } else {
          return next();
        }
      } else {
        return callback();
      }
    }
  }

  next();
};

module.exports = Stack;
