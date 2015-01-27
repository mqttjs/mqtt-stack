var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var SessionManager = require('../../../src/middlewares/session_manager');

describe('SessionManager', function(){
  it('should call "newSession" with clean flag', function(done){
    var stream = new EventEmitter();

    stream.connack = function(){
      assert(!packet.sessionPresent);
      done();
    };

    var packet = {
      cmd: 'connect'
    };

    var middleware = new SessionManager();

    middleware.handle(stream, packet);
  });

  it('should call "resumeSession" with clean flag', function(done){
    var stream = new EventEmitter();

    stream.connack = function(packet){
      assert(!packet.sessionPresent);
      done();
    };

    var packet = {
      cmd: 'connect',
      clean: false
    };

    var middleware = new SessionManager();

    middleware.handle(stream, packet);
  });

  it('should call "resumeSession" with clean flag', function(done){
    var stream = new EventEmitter();

    stream.connack = function(packet){
      assert(packet.sessionPresent);
      done();
    };

    var packet = {
      cmd: 'connect',
      clean: false
    };

    var middleware = new SessionManager({
      resumeSession: function(ctx, callback) {
        callback(null, true);
      }
    });

    middleware.handle(stream, packet);
  });

  it('should call "storeSession" with clean flag on "uncleanDisconnect"', function(done){
    var stream = new EventEmitter();

    stream.connack = function(){};

    var packet = {
      cmd: 'connect',
      clean: false
    };

    var middleware = new SessionManager({
      resumeSession: function(ctx, callback) {
        callback(null, false);
      },
      storeSession: function(ctx) {
        done();
      }
    });

    middleware.handle(stream, packet);
    stream.emit('uncleanDisconnect');
  });

  it('should call "storeSession" with clean flag on "cleanDisconnect"', function(done){
    var stream = new EventEmitter();

    stream.connack = function(){};

    var packet = {
      cmd: 'connect',
      clean: false
    };

    var middleware = new SessionManager({
      resumeSession: function(ctx, callback) {
        callback(null, false);
      },
      storeSession: function(ctx) {
        done();
      }
    });

    middleware.handle(stream, packet);
    stream.emit('cleanDisconnect');
  });
});
