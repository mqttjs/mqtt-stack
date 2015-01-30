var expect = require('expect.js');

var f = require('../../support/factory');

describe('Publish', function(){
  it('should support subscribing and publishing', function(done) {
    var d = f.countDone(2, done);

    f.rawClient(function(client1, opts){
      client1.connect(opts);

      var messageId = f.mid();
      var subscriptions = [{
        topic: 'hello',
        qos: 0
      }];

      client1.on('publish', function(packet) {
        expect(packet.topic).to.be.eql('hello');
        expect(packet.payload.toString()).to.be.eql('some data');
        client1.disconnect();
      });

      client1.on('suback', function() {
        f.rawClient(function(client2, opts){
          client2.connect(opts);

          client2.publish({
            topic: 'hello',
            payload: 'some data',
            messageId: messageId
          });

          client2.disconnect();
        }, d);
      });

      client1.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    }, d);
  });

  it('should not publish topic with wildcards (MQTT-3.3.2-2)', function(done){
    f.client(function(client){
      client.on('message', function(){
        client.end();
        throw new Error('this message should not have been published');
      });
      client.publish('/hello/+');
      client.end();
    }, done);
  });

  it('should support publishing big messages', function(done) {
    var d = f.countDone(2, done);

    var bigPayload = new Buffer(5 * 1024);
    bigPayload.fill('42');

    f.client(function(client1){
      client1.on('message', function(topic, payload) {
        expect(topic).to.be.eql('hello');
        expect(payload.length).to.be.eql(bigPayload.length);
        client1.end();
      });

      client1.subscribe('hello', 0, function(){
        f.client(function(client2){
          client2.publish('hello', bigPayload);
          client2.end();
        }, d);
      });
    }, d);
  });

  it('QoS 1 wildcard subscriptions should receive QoS 1 messages at QoS 1', function (done) {
    f.client(function(client){
      client.once('message', function(_, __, packet) {
        expect(packet.qos).to.be.eql(1);
        client.end();
      });

      client.subscribe({'hello/#': 1}, function(){
        client.publish('hello/foo', 'hello', {
          qos: 1
        });
      });
    }, done);
  });
});
