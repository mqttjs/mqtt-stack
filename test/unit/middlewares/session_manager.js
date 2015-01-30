var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var stackHelper = require('../../support/stack_helper');
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

    stackHelper.executeOnSelf(middleware);

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

    stackHelper.executeOnSelf(middleware);

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

    stackHelper.executeOnSelf(middleware);

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

    stackHelper.executeOnSelf(middleware);

    middleware.handle(stream, packet);
    middleware.uncleanDisconnect({
      client: stream
    });
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
      storeSession: function() {
        done();
      }
    });

    stackHelper.executeOnSelf(middleware);

    middleware.handle(stream, packet);
    middleware.cleanDisconnect({
      client: stream
    });
  });
});
