var assert = require('assert');
var stream = require('stream');

var Stack = require('../../src/stack');

describe('Stack', function () {
    it("should run stack when data is available", function (done) {
        var client = {};

        var stack = new Stack();

        stack.use({
            handle: function (_client, packet, next) {
                assert.equal(_client, client);
                assert.equal(packet, 'hello');
                next();
            }
        });

        stack.use({
            handle: function (_client, packet, next, done) {
                assert.equal(_client, client);
                assert.equal(packet, 'hello');
                done();
            }
        });

        stack.process(client, 'hello', done);
    });

    it("should call error handler on error", function (done) {
        var client = {};

        var stack = new Stack(function (err) {
            assert.equal(err, 'error');
            done();
        });

        stack.use({
            handle: function (_client, packet, next) {
                assert.equal(_client, client);
                assert.equal(packet, 'hello');
                next('error');
            }
        });

        stack.use({
            handle: function () {
                assert(false);
            }
        });

        stack.process(client, 'hello', function () {
        });
    });

    it("should call install for each client", function (done) {
        var client = {};
        var stack = new Stack();

        stack.use({
            install: function (_client) {
                assert.equal(_client, client);
            }
        });

        stack.use({
            install: function (_client) {
                assert.equal(_client, client);
                done();
            }
        });

        stack.install(client);
    });

    it('should set the stack on the middleware', function () {
        var stack = new Stack();
        var middleware = {};
        stack.use(middleware);
        assert(middleware.stack, stack);
    });

    it('should execute a function on all middlewares and collect responses', function (done) {
        var stack = new Stack();

        stack.use({
            testFunction: function (n, store, callback) {
                store.push(n + 1);
                callback();
            }
        });

        stack.use({
            testFunction: function (n, store, callback) {
                store.push(n + 2);
                callback();
            }
        });

        var store = [];

        stack.execute('testFunction', 1, store, function () {
            assert.deepEqual(store, [2, 3]);
            done();
        });
    });

    it('should execute a function on all middlewares even if there are none', function (done) {
        var stack = new Stack();
        stack.execute('testFunction', 1, done);
    });

    it('should execute a function on all middlewares and catch errors', function (done) {
        var stack = new Stack();

        stack.use({
            testFunction: function (n, __, callback) {
                callback();
            }
        });

        stack.use({
            testFunction: function (n, __, callback) {
                callback(new Error('fail'));
            }
        });

        stack.execute('testFunction', 1, function (err) {
            assert(err);
            done();
        });
    });

    it('should execute a function on all middlewares and provide common store', function (done) {
        var stack = new Stack();

        stack.use({
            testFunction: function (_, store, callback) {
                store[0]++;
                callback();
            }
        });

        stack.use({
            testFunction: function (_, store, callback) {
                store[0]++;
                callback();
            }
        });

        var store = [1];

        stack.execute('testFunction', 1, store, function (err) {
            assert(!err);
            assert.equal(store, 3);
            done();
        });
    });
});
