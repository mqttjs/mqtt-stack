var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var Stack = require('../../src/stack');

describe('Stack', function(){
  it("should run stack when 'data' is emitted", function(done){
    var client = new EventEmitter();
    var stack = new Stack();

    stack.use({
      handle: function(_client, packet, next) {
        assert.equal(_client, client);
        assert.equal(packet, 'hello');
        next();
      }
    });

    stack.use({
      handle: function(_client, packet) {
        assert.equal(_client, client);
        assert.equal(packet, 'hello');
        done();
      }
    });

    stack.handle(client);
    client.emit('data', 'hello');
  });

  it("should call error handler on error", function(done){
    var client = new EventEmitter();

    var stack = new Stack(function(err){
      assert.equal(err, 'error');
      done();
    });

    stack.use({
      handle: function(_client, packet, next) {
        assert.equal(_client, client);
        assert.equal(packet, 'hello');
        next('error');
      }
    });

    stack.use({
      handle: function() {
        assert(false);
      }
    });

    stack.handle(client);
    client.emit('data', 'hello');
  });

  it("should call install for each client", function(done){
    var client = new EventEmitter();
    var stack = new Stack();

    stack.use({
      install: function(_client) {
        assert.equal(_client, client);
      }
    });

    stack.use({
      install: function(_client) {
        assert.equal(_client, client);
        done();
      }
    });

    stack.handle(client);
  });

  it('should set the stack on the middleware', function(){
    var stack = new Stack();
    var middleware = {};
    stack.use(middleware);
    assert(middleware.stack, stack);
  });

  it('should execute a function on all middlewares and collect responses', function(done){
    var stack = new Stack();

    stack.use({
      testFunction: function(n, callback) {
        callback(null, n + 1);
      }
    });

    stack.use({
      testFunction: function(n, callback) {
        callback(null, n + 2);
      }
    });

    stack.execute('testFunction', 1, function(_, result){
      assert.equal(result[0], 2);
      assert.equal(result[1], 3);
      done();
    });
  });

  it('should execute a function on all middlewares and catch errors', function(done){
    var stack = new Stack();

    stack.use({
      testFunction: function(ctx, callback) {
        callback(null, 1 + 1);
      }
    });

    stack.use({
      testFunction: function(_, callback) {
        callback(new Error('fail'));
      }
    });

    stack.execute('testFunction', 1, function(err, result){
      assert(err);
      assert.equal(result[0], 2);
      assert.equal(result[1], undefined);
      done();
    });
  });
});
