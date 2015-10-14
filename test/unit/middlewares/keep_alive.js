var assert = require('assert');

var KeepAlive = require('../../../src/middlewares/keep_alive');

describe('KeepAlive', function () {
    it('should respond to pingreq', function (done) {
        var client = {};

        client.write = function (_, cb) {
            cb();
        };

        var middleware = new KeepAlive();

        middleware.handle(client, {
            cmd: 'pingreq'
        }, function () {
        }, done);
    });

    it("should start default timer and close connection on inactivity", function (done) {
        var client = {};

        client.destroy = function () {
            client.on('uncleanDisconnect', done);
        };

        var middleware = new KeepAlive({
            defaultTimeout: 0.001
        });

        middleware.stack = {
            execute: function (fn, ctx) {
                assert.equal(fn, 'closeClient');
                assert.equal(ctx.client, client);
                done();
            }
        };

        middleware.install(client);
    });

    it("should restart timer and close connection on inactivity", function (done) {
        var client = {};

        client.destroy = function () {
            client.on('uncleanDisconnect', done);
        };

        var middleware = new KeepAlive();

        middleware.stack = {
            execute: function (fn, ctx) {
                assert.equal(fn, 'closeClient');
                assert.equal(ctx.client, client);
                done();
            }
        };

        middleware.handle(client, {
            cmd: 'connect',
            keepalive: 0.001
        }, function () {
        });
    });
});
