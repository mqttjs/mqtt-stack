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
});
