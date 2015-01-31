var assert = require('assert');
var expect = require('expect.js');
var async = require('async');

var f = require('../../support/factory');

describe('Retain', function(){
  it('should support retained messages (MQTT-2.1.2-6, MQTT-2.1.2-7, MQTT-2.1.2-9)', function(done) {
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

  //TODO: test unclean session and retain
});
