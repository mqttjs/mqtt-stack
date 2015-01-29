var expect = require('expect.js');

var f = require('../../support/factory');

describe('Connection', function(){
  it('should close client on corrupt packet (MQTT-2.0.0-1)', function(done){
    f.rawClient(function(client){
      client.stream.write("\x00\x00\x00\x00\x00\x00");
    }, done);
  });

  it('should send a pingresp when it receives a pingreq (MQTT-3.12.4-1)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      client.on('pingresp', function() {
        client.disconnect();
      });

      client.pingreq();
    }, done);
  });

  it('should close connection on not connect (MQTT-3.1.0-1)', function(done){
    f.rawClient(function(client){
      client.pingreq();
    }, done);
  });

  it('should close connection on duplicate connect (MQTT-3.1.0-2)', function(done){
    f.rawClient(function(client, opts){
      client.connect(opts);
      client.connect(opts);
    }, done);
  });

  it('should close connection on wrong protocol id (MQTT-3.1.2-1)', function(done){
    f.rawClient(function(client, opts){
      opts.protocolId = 'FOO';
      client.connect(opts);
    }, done);
  });

  it('should support connecting and disconnecting', function(done) {
    f.client(function(client){
      client.end();
    }, done);
  });

  it('should support connecting and disconnecting with a zero keepalive', function(done) {
    f.client({
      keepalive: 0
    }, function(client){
      client.end();
    }, done);
  });

  it('should send a connack packet with returnCode 0', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      client.on('connack', function(packet) {
        client.disconnect();
        expect(packet.returnCode).to.eql(0);
      });
    }, done);
  });

  it('should send a connack packet with returnCode 0 if the clientId is 65535 chars (MQTT-3.1.3-4)', function(done) {
    f.rawClient(function(client, opts){
      var clientId = [];

      for(var i=0; i < 65535; i++) {
        clientId.push('i');
      }

      opts.clientId = clientId.join('');

      client.connect(opts);

      client.on('connack', function(packet) {
        client.disconnect();
        expect(packet.returnCode).to.eql(0);
      });
    }, done);
  });

  it('should send a connack packet with returnCode 0 if the clientId is 1 char', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = 'i';
      client.connect(opts);

      client.on('connack', function(packet) {
        client.disconnect();
        expect(packet.returnCode).to.eql(0);
      });
    }, done);
  });

  it('should send a connack packet with returnCode 0 if clientId is empty (MQTT-3.1.3-6)', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = new Buffer('');
      client.connect(opts);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(0);
        client.disconnect();
      });
    }, done);
  });

  it('should send a connack packet with returnCode 2 if clientId is empty and not clean (MQTT-3.1.3-7, MQTT-3.1.3-8)', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = new Buffer('');
      opts.clean = false;
      client.connect(opts);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(2);
      });
    }, done);
  });

  it('should close the first client if a second client with the same clientId connects (MQTT-3.1.4-2)', function(done) {
    var d = f.countDone(2, done);
    f.client({
      clientId: 'same'
    }, function(){
      f.client({
        clientId: 'same'
      }, function(client2){
        client2.end();
      }, d);
    }, d);
  });

  it('should terminate connection when ping is missing (MQTT-3.1.2-22)', function(done){
    this.timeout(3000);

    f.rawClient(function(client){
      client.connect({
        keepalive: 1,
        clientId: 'test1'
      });

      client.on('close', function(){
        done();
      })
    });
  });

  it('should correctly renew the keepalive window after any transmission', function(done) {
    this.timeout(4000);

    var ok;

    f.rawClient(function(client, opts){
      opts.keepalive = 1;
      client.connect(opts);

      client.on('close', function() {
        if(!ok) {
          throw new Error('should not have been hapenned');
        }
      });

      setTimeout(function() {
        client.publish({
          topic: "hello",
          payload: "some data"
        });
      }, 1000);

      setTimeout(function(){
        ok = true;
        client.disconnect();
      }, 3000);
    }, done);
  });

  it('should send last will if requested (MQTT-3.1.2-8, MQTT-3.1.2-10, MQTT-3.1.2-14)', function(done){
    var d = f.countDone(2, done);

    f.client({
      will: {
        topic: '/last-will-1',
        payload: 'hello'
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(topic, payload, packet){
          expect(topic).to.be.eql('/last-will-1');
          expect(payload.toString()).to.be.eql('hello');
          expect(packet.retain).to.not.be.ok();
          client2.end();
        });
        client2.subscribe('/last-will-1', function(){
          client1.stream.end();
        });
      }, d);
    }, d);
  });

  it('should send last will if requested and keep retain (MQTT-3.1.2-15)', function(done){
    var d = f.countDone(2, done);

    f.client({
      will: {
        topic: '/last-will-1',
        payload: 'hello',
        retain: true
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(topic, payload, packet){
          expect(topic).to.be.eql('/last-will-1');
          expect(payload.toString()).to.be.eql('hello');
          expect(packet.retain).to.not.ok();
          client2.end();
        });
        client2.subscribe('/last-will-1', function(){
          client1.stream.end();
        });
      }, d);
    }, d);
  });

  it('should not send will on proper disconnect (MQTT-3.14.4-3)', function(done){
    var d = f.countDone(2, done);

    f.client({
      will: {
        topic: '/last-will-1',
        payload: 'hello',
        retain: true
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(){
          client2.end();
          throw new Error('this message should not have been published');
        });
        client2.subscribe('/last-will-1', function(){
          client1.end();
          client2.end();
        });
      }, d);
    }, d);
  });
});
