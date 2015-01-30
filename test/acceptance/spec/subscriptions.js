var expect = require('expect.js');
var async = require('async');

var f = require('../../support/factory');

describe('Subscriptions', function(){
  it('should support subscribing and send suback (MQTT-3.8.4-1, MQTT-3.8.4-2)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      var messageId = f.mid();
      var subscriptions = [{
        topic: 'hello',
        qos: 0
      }];

      client.on('suback', function(packet) {
        expect(packet).to.have.property('messageId', messageId);
        client.disconnect();
      });

      client.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    }, done);
  });

  it('should support subscribing to multiple topics (MQTT-3.9.3-1)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      var messageId = f.mid();
      var subscriptions = [{
        topic: 'hello',
        qos: 1
      }, {
        topic: 'hello2',
        qos: 0
      }];

      client.on('suback', function(packet) {
        client.disconnect();
        expect(packet.granted).to.be.eql([1, 0]);
      });

      client.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    }, done);
  });

  it('should support unsubscribing (MQTT-3.10.3-4)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      var messageId = f.mid();
      var subscriptions = [{
        topic: 'hello',
        qos: 1
      }];

      client.on('unsuback', function(packet) {
        expect(packet).to.have.property('messageId', messageId);
        client.disconnect();
      });

      client.on('suback', function() {
        client.unsubscribe({
          unsubscriptions: ['hello'],
          messageId: messageId
        });
      });

      client.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    }, done);
  });

  it('should support unsubscribing even if there is no subscription (MQTT-3.10.3-5)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      var messageId = f.mid();

      client.on('unsuback', function(packet) {
        expect(packet).to.have.property('messageId', messageId);
        client.disconnect();
      });

      client.unsubscribe({
        unsubscriptions: ['hello'],
        messageId: messageId
      });
    }, done);
  });

  it('should unsubscribe for real (MQTT-3.10.3-2)', function(done) {
    f.client(function(client){
      client.on('message', function() {
        client.end();
        throw new Error('this message should not have been published');
      });

      client.subscribe('hello', function(){
        client.unsubscribe('hello', function(){
          client.publish('hello', 'data');
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

      client.subscribe('hello/+/there/#', function(){
        client.unsubscribe('hello/+/there/#', function(){
          client.publish('hello/foo/there/bar', 'data');
          client.end();
        });
      });
    }, done);
  });

  it('should support subscribing to # wildcard', function(done) {
    var d = f.countDone(2, done);

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('hello/world');
        expect(payload.toString()).to.be.eql('some data');
        client1.end();
      });

      client1.subscribe('hello/#', function(){
        f.client(function(client2){
          client2.publish('hello/world', 'some data');
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to + wildcard', function(done) {
    var d = f.countDone(2, done);

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('hello/world');
        expect(payload.toString()).to.be.eql('some data');
        client1.end();
      });

      client1.subscribe('hello/+', function(){
        f.client(function(client2){
          client2.publish('hello/world', 'some data');
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to topics with multiple wildcards', function(done) {
    var d = f.countDone(2, done);

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('hello/foo/world/bar');
        expect(payload.toString()).to.be.eql('some data');
        client1.end();
      });

      client1.subscribe('hello/+/world/#', function(){
        f.client(function(client2){
          client2.publish('hello/foo/world/bar', 'some data');
          client2.end();
        }, d);
      });
    }, d);
  });

  it('should support subscribing to QoS 1', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);
      var messageId = f.mid();
      var subscriptions = [{
        topic: 'hello',
        qos: 1
      }
      ];

      client.on('suback', function(packet) {
        expect(packet.granted).to.be.eql([1]);
        client.disconnect();
      });

      client.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    }, done);
  });

  xit('should support subscribing with overlapping topics and receiving message only once', function(done) {
    var d = f.countDone(2, done);
    var called = 0;

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        called++;
        expect(topic).to.be.eql('a/b');
        expect(payload.toString()).to.be.eql('some other data');
        expect(called).to.be.eql(1);
      });
      client1.subscribe({
        'a/+': 1,
        '+/b': 1,
        'a/b': 1
      }, function(){
        f.client(function(client2){
          client2.publish('a/b', 'some other data', {
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
