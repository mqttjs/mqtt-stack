var expect = require('expect.js');

var f = require('../../support/factory');

describe('Subscriptions', function(){
  it('should support subscribing and sending a suback (MQTT-3.8.4-1, MQTT-3.8.4-2)', function(done) {
    var m = f.m();
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.on('suback', function(packet) {
        expect(packet.messageId).to.be.eql(m);
        expect(packet.granted).to.be.eql([0]);
        client.disconnect();
      });
      client.subscribe({
        subscriptions: [{
          topic: f.t(),
          qos: 0
        }],
        messageId: m
      });
    }, done);
  });

  it('should support subscribing to multiple topics (MQTT-3.9.3-1, MQTT-3.8.4-5)', function(done) {
    var m = f.m();
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.on('suback', function(packet) {
        client.disconnect();
        expect(packet.messageId).to.be.eql(m);
        expect(packet.granted).to.be.eql([1, 0]);
      });
      client.subscribe({
        subscriptions: [{
          topic: f.t(),
          qos: 1
        }, {
          topic: f.t(),
          qos: 0
        }],
        messageId: m
      });
    }, done);
  });

  it('should support unsubscribing (MQTT-3.10.3-4)', function(done) {
    var m = f.m();
    var t = f.t();
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.on('unsuback', function(packet) {
        expect(packet.messageId).to.be.eql(m);
        client.disconnect();
      });

      client.on('suback', function() {
        client.unsubscribe({
          unsubscriptions: [t],
          messageId: m
        });
      });

      client.subscribe({
        subscriptions: [{
          topic: t,
          qos: 1
        }],
        messageId: m
      });
    }, done);
  });

  it('should support unsubscribing even if there is no subscription (MQTT-3.10.3-5)', function(done) {
    var m = f.m();
    var t = f.t();
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.on('unsuback', function(packet) {
        expect(packet.messageId).to.be.eql(m);
        client.disconnect();
      });

      client.unsubscribe({
        unsubscriptions: [t],
        messageId: m
      });
    }, done);
  });

  it('should unsubscribe for real (MQTT-3.10.3-2)', function(done) {
    var t = f.t();
    var p = f.p();
    f.client(function(client){
      client.on('message', function() {
        client.end();
        throw new Error('this message should not have been published');
      });

      client.subscribe(t, function(){
        client.unsubscribe(t, function(){
          client.publish(t, p);
          client.end();
        });
      });
    }, done);
  });

  it('should unsubscribe from topics with multiple wildcards', function(done) {
    f.client(function(client){
      client.on('message', function() {
        client.end();
        throw new Error('this message should not have been published');
      });
      client.subscribe('foo/+/bar/#', function(){
        client.unsubscribe('foo/+/bar/#', function(){
          client.publish('foo/foo/bar/bar', f.p());
          client.end();
        });
      });
    }, done);
  });

  it('should support subscribing to # wildcard', function(done) {
    var d = f.countDone(2, done);
    var p = f.p();
    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('foo/bar');
        expect(payload.toString()).to.be.eql(p);
        client1.end();
      });
      client1.subscribe('foo/#', function(){
        f.client(function(client2){
          client2.publish('foo/bar', p);
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to + wildcard', function(done) {
    var d = f.countDone(2, done);
    var p = f.p();
    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('foo/bar');
        expect(payload.toString()).to.be.eql(p);
        client1.end();
      });

      client1.subscribe('foo/+', function(){
        f.client(function(client2){
          client2.publish('foo/bar', p);
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to topics with multiple wildcards', function(done) {
    var d = f.countDone(2, done);
    f.client(function(client1){
      var p = f.p();
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('foo/foo/bar/bar');
        expect(payload.toString()).to.be.eql(p);
        client1.end();
      });

      client1.subscribe('foo/+/bar/#', function(){
        f.client(function(client2){
          client2.publish('foo/foo/bar/bar', p);
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to QoS 1', function(done) {
    var t = f.t();
    var m = f.m();
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.on('suback', function(packet) {
        expect(packet.granted).to.be.eql([1]);
        client.disconnect();
      });
      client.subscribe({
        subscriptions: [{
          topic: t,
          qos: 1
        }],
        messageId: m
      });
    }, done);
  });

  it('should support subscribing with overlapping topics and receiving message only once', function(done) {
    var d = f.countDone(2, done);
    var p = f.p();
    var called = 0;

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        called++;
        expect(topic).to.be.eql('foo/bar');
        expect(payload.toString()).to.be.eql(p);
        expect(called).to.be.eql(1);
      });
      client1.subscribe({
        'foo/+': 1,
        '+/bar': 1,
        'foo/bar': 1
      }, function(){
        f.client(function(client2){
          client2.publish('foo/bar', p, {
            qos: 1
          }, function(){
            client1.end();
            client2.end();
          });
        }, d);
      });
    }, d);
  });
});
