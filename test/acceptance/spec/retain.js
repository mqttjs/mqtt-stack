var assert = require('assert');
var expect = require('expect.js');
var async = require('async');

var f = require('../../support/factory');

/**
 * Tests related to retained messages.
 * This feature can be ignored by brokers, that only want to support a subset.
 */
describe('Retain', function(){
  it('should support retained messages (MQTT-2.1.2-6, MQTT-2.1.2-7, MQTT-2.1.2-9)', function(done) {
    var t = f.t();
    var p1 = f.p();
    var p2 = f.p();
    var p3 = f.p();
    async.waterfall([
      function(cb) {
        f.client(function(client){
          client.publish(t, p1, {
            qos: 1,
            retain: true
          }, function(){
            client.publish(t, p2, {
              qos: 1,
              retain: true
            }, function(){
              client.publish(t, p3, {
                qos: 1
              }, function(){
                client.end();
              });
            });
          });
        }, cb);
      },
      function(cb) {
        f.client(function(client){
          client.on('message', function(topic, payload, packet) {
            expect(topic).to.be.eql(t);
            expect(payload.toString()).to.be.eql(p2);
            expect(packet.retain).to.be.ok();
            client.end();
          });
          client.subscribe(t);
        }, cb);
      }
    ], done);
  });

  it('should override retain for normal message forwarding (MQTT-2.1.2-10)', function(done){
    var t = f.t();
    f.client(function(client1){
      f.client(function(client2){
        client1.subscribe(t, function(){
          client2.publish(t, f.p(), {
            retain: true
          });
        });
        client1.on('message', function(topic, payload, packet){
          assert.equal(packet.retain, false);
          done();
        });
      });
    });
  });

  it('should remove retained message when payload is empty (MQTT-2.1.2-11)', function(done){
    var t = f.t();
    var p1 = f.p();
    async.waterfall([
      function(cb) {
        f.client(function(client){
          client.publish(t, p1, {
            qos: 1,
            retain: true
          }, function(){
            client.publish(t, '', {
              qos: 1,
              retain: true
            }, function(){
              client.end();
            });
          });
        }, cb);
      },
      function(cb) {
        f.client(function(client){
          client.on('message', function() {
            throw new Error('this should not happen!');
          });
          client.subscribe(t, function(){
            client.end();
          });
        }, cb);
      }
    ], done);
  });

  it('should not override retained message on normal publish (MQTT-2.1.2-12)', function(done) {
    var t = f.t();
    var p1 = f.p();
    var p2 = f.p();
    async.waterfall([
      function(cb) {
        f.client(function(client){
          client.publish(t, p1, {
            qos: 1,
            retain: true
          }, function(){
            client.publish(t, p2, {
              qos: 1
            }, function(){
              client.end();
            });
          });
        }, cb);
      },
      function(cb) {
        f.client(function(client){
          client.on('message', function(topic, payload, packet) {
            expect(topic).to.be.eql(t);
            expect(payload.toString()).to.be.eql(p1);
            expect(packet.retain).to.be.ok();
            client.end();
          });
          client.subscribe(t);
        }, cb);
      }
    ], done);
  });

  //TODO: is that not supported?
  xit('should send retained messages for restored subscriptions', function(done) {
    var c = f.c();
    var t = f.t();
    var p = f.p();
    async.series([
      function(cb) {
        f.client({
          clientId: c,
          clean: false
        }, function(client){
          client.publish(t, p, { retain: true }, function(){
            client.subscribe(t, function(){
              client.end();
            });
          });
        }, cb);
      },
      function(cb) {
        f.client({
          clientId: c,
          clean: false
        }, function(client){
          client.on('message', function(){
            client.end();
          });
        }, cb);
      }
    ], done);
  });

  it('should resend retained messages on same subscription (MQTT-3.8.4-3)', function(done) {
    var t = f.t();
    var p1 = f.p();
    var c = 0;
    async.waterfall([
      function(cb) {
        f.client(function(client){
          client.publish(t, p1, {
            qos: 1,
            retain: true
          }, function(){
            client.end();
          });
        }, cb);
      },
      function(cb) {
        f.client(function(client){
          client.on('message', function() {
            c++;
            if(c == 2) {
              client.end();
            }
          });
          client.subscribe(t);
          client.subscribe(t);
        }, cb);
      }
    ], done);
  });

  it('should send last will if requested and keep retain (MQTT-3.1.2-15)', function(done){
    var d = f.countDone(2, done);
    var t = f.t();
    var p = f.p();

    f.client({
      will: {
        topic: t,
        payload: p,
        retain: true
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(topic, payload, packet){
          expect(topic).to.be.eql(t);
          expect(payload.toString()).to.be.eql(p);
          expect(packet.retain).to.not.be.ok();
          client2.end();
        });
        client2.subscribe(t, function(){
          client1.stream.end();
        });
      }, d);
    }, d);
  });
});
