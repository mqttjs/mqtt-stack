var assert = require('assert');
var stream = require('stream');

var stackHelper = require('../stack_helper');
var Connection = require('../../../src/middlewares/connection');

describe('Connection', function () {
    it('should close client if first packet is not a "connect"', function (done) {
        var client = new stream.Duplex();

        var called = false;

        client.close = function () {
            called = true;
        };

        var middleware = new Connection();

        middleware.install(client);

        middleware.handle(client, {
            cmd: 'test'
        }, function () {
        }, function () {
            assert(called);
            done();
        });
    });

    it('should close client if "connect" is sent more than once', function (done) {
        var client = new stream.Duplex();

        var called = false;

        client.close = function () {
            called = true;
        };

        var middleware = new Connection();

        middleware.install(client);

        middleware.stack = {
            execute: function (fn, ctx, callback) {
                assert.equal(fn, 'uncleanDisconnect');
                assert.equal(ctx.client, client);
                callback();
            }
        };

        middleware.handle(client, {
            cmd: 'connect'
        }, function () {
        }, function () {
        });

        middleware.handle(client, {
            cmd: 'connect'
        }, function () {
        }, function () {
            assert(called);
            done();
        });
    });

    it("should close client and emit 'cleanDisconnect' on 'disconnect' package", function (done) {
        var client = new stream.Duplex();

        var called = false;

        client.close = function () {
            called = true;
        };

        var middleware = new Connection();

        middleware.install(client);

        middleware.stack = {
            execute: function (fn, ctx, callback) {
                assert.equal(fn, 'cleanDisconnect');
                assert.equal(ctx.client, client);
                callback();
            }
        };

        middleware.handle(client, {
            cmd: 'connect'
        }, function () {
        }, function () {
        });

        middleware.handle(client, {
            cmd: 'disconnect'
        }, function () {
        }, function () {
            assert(called);
            done();
        });
    });

    it("should emit 'uncleanDisconnect' on 'close' event", function (done) {
        var client = new stream.Duplex();

        client.close = function () {
        };

        var middleware = new Connection();

        middleware.install(client);

        middleware.stack = {
            execute: function (fn, ctx) {
                assert.equal(fn, 'uncleanDisconnect');
                assert.equal(ctx.client, client);
                done();
            }
        };

        client.emit('close');
    });

    it("should close client and emit 'uncleanDisconnect' on 'error' event", function (done) {
        var client = new stream.Duplex();

        var called = false;

        client.close = function () {
            called = true;
        };

        var middleware = new Connection();

        middleware.install(client);

        middleware.stack = {
            execute: function (fn, ctx) {
                assert.equal(fn, 'uncleanDisconnect');
                assert(called);
                done();
            }
        };

        client.emit('error');
    });

    it('should close client if protocol is not mqtt 4', function (done) {
        var client = new stream.Duplex();

        var called = false;

        client.close = function () {
            called = true;
        };

        var middleware = new Connection({
            forceMQTT4: true
        });

        middleware.install(client);

        middleware.handle(client, {
            cmd: 'connet',
            protocolId: 'hello'
        }, function () {
        }, function () {
            assert(called);
            done();
        });
    });

    it('should close client if "closeClient" has been called', function (done) {
        var middleware = new Connection();

        stackHelper.mockExecute(middleware, {
            uncleanDisconnect: function (ctx) {
            }
        });

        middleware.closeClient({
            client: {
                close: function () {
                    done();
                }
            }
        });
    });
});
