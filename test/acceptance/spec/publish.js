var assert = require('assert');
var expect = require('expect.js');
var async = require('async');

var f = require('../../support/factory');

describe('Publish', function(){
  it('should support subscribing and publishing', function(done) {
    var d = f.countDone(2, done);
    var m = f.m();
    var t = f.t();
    var p = f.p();

    f.rawClient(function(client1, opts){
      client1.connect(opts);

      client1.on('publish', function(packet) {
        expect(packet.topic).to.be.eql(t);
        expect(packet.payload.toString()).to.be.eql(p);
        client1.disconnect();
      });

      client1.on('suback', function() {
        f.rawClient(function(client2, opts){
          client2.connect(opts);

          client2.publish({
            topic: t,
            payload: p,
            messageId: m
          });

          client2.disconnect();
        }, d);
      });

      client1.subscribe({
        subscriptions: [{
          topic: t,
          qos: 0
        }],
        messageId: m
      });
    }, d);
  });

  it('should relay and forward QoS 0 message', function(done){
    var t = f.t();
    var p = f.p();
    f.client(function(client1){
      f.client(function(client2){
        client1.subscribe(t, function(){
          client2.publish(t, p);
        });
        client1.on('message', function(topic, payload, packet){
          assert.equal(topic, t);
          assert.equal(payload, p);
          assert.equal(packet.qos, 0);
          done();
        });
      });
    });
  });

  it('should relay and forward QoS 1 message', function(done){
    var t = f.t();
    var p = f.p();
    f.client(function(client1) {
      f.client(function (client2) {
        client1.on('message', function(topic, payload, packet){
          assert.equal(topic, t);
          assert.equal(payload, p);
          assert.equal(packet.qos, 1);
          done();
        });

        client1.subscribe(t, { qos: 1 }, function(){
          client2.publish(t, p, { qos: 1 });
        });
      });
    });
  });

  it('should not publish topic with wildcards (MQTT-3.3.2-2)', function(done){
    f.client(function(client){
      client.on('message', function(){
        client.end();
        throw new Error('this message should not have been published');
      });
      client.publish('/foo/+');
      client.end();
    }, done);
  });

  it('should support publishing big messages', function(done) {
    var d = f.countDone(2, done);
    var t = f.t();

    var bigPayload = new Buffer(5 * 1024);
    bigPayload.fill('42');

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql(t);
        expect(payload.length).to.be.eql(bigPayload.length);
        client1.end();
      });

      client1.subscribe(t, 0, function(){
        f.client(function(client2){
          client2.publish(t, bigPayload);
          client2.end();
        }, d);
      });
    }, d);
  });

  it('QoS 1 wildcard subscriptions should receive QoS 1 messages at QoS 1', function (done) {
    var p = f.p();
    f.client(function(client){
      client.once('message', function(topic, payload, packet) {
        expect(topic).to.be.eql('foo/bar');
        expect(payload.toString()).to.be.eql(p);
        expect(packet.qos).to.be.eql(1);
        client.end();
      });

      client.subscribe({'foo/#': 1}, function(){
        client.publish('foo/bar', p, {
          qos: 1
        });
      });
    }, done);
  });

  it('should support send a puback when publishing QoS 1 messages', function(done) {
    var m = f.m();
    var t = f.t();
    f.rawClient(function(client, opts){
      client.connect(opts);

      client.on('puback', function(packet) {
        expect(packet.messageId).to.be.eql(m);
        client.disconnect();
      });

      client.publish({
        topic: t,
        qos: 1,
        messageId: m
      });
    }, done);
  });

  xit('should receive all messages at QoS 1 if a subscription is done with QoS 0', function(done) {
    var t = f.t();
    var p = f.p();
    f.client(function(client){
      client.once('message', function(topic, payload, packet) {
        expect(topic).to.be.eql(t);
        expect(payload.toString()).to.be.eql(p);
        expect(packet.qos).to.be.eql(0);
        client.end();
      });

      client.subscribe(t, function(){
        client.publish(t, p, { qos: 1 });
      });
    }, done);
  });

  xit('should support retained messages (MQTT-2.1.2-6, MQTT-2.1.2-7, MQTT-2.1.2-9)', function(done) {
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
});
