var expect = require('expect.js');

var f = require('../../support/factory');

/**
 * Basic connection related tests.
 * These features should be implemented by all brokers the same way.
 */
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

  it('should close connection on not connect packet (MQTT-3.1.0-1)', function(done){
    f.rawClient(function(client){
      client.pingreq();
    }, done);
  });

  it('should close connection on multiple connect packets (MQTT-3.1.0-2)', function(done){
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

  it('should accept clientIds with 65535 chars (MQTT-3.1.3-4)', function(done) {
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

  it('should accept clientIds with 1 char', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = 'i';
      client.connect(opts);

      client.on('connack', function(packet) {
        client.disconnect();
        expect(packet.returnCode).to.eql(0);
      });
    }, done);
  });

  it('should accept empty clientIds (MQTT-3.1.3-6)', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = new Buffer('');
      client.connect(opts);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(0);
        client.disconnect();
      });
    }, done);
  });

  it('should reject when clientId is empty and not clean (MQTT-3.1.3-7, MQTT-3.1.3-8)', function(done) {
    f.rawClient(function(client, opts){
      opts.clientId = new Buffer('');
      opts.clean = false;
      client.connect(opts);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(2);
      });
    }, done);
  });

  it('should close already connected clients with same clientId (MQTT-3.1.4-2)', function(done) {
    var d = f.countDone(2, done);
    var c = f.c();
    f.client({
      clientId: c
    }, function(){
      f.client({
        clientId: c
      }, function(client2){
        client2.end();
      }, d);
    }, d);
  });

  it('should terminate connection when ping is missing (MQTT-3.1.2-22)', function(done){
    f.rawClient(function(client, opts){
      opts.keepalive = 1;
      client.connect(opts);

      client.on('close', function(){
        done();
      })
    });
  });

  it('should correctly renew the keepalive window after any transmission', function(done) {
    this.timeout(3000);

    var ok = false;

    f.rawClient(function(client, opts){
      opts.keepalive = 2;
      client.connect(opts);

      client.on('close', function() {
        if(!ok) {
          throw new Error('should not have been hapenned');
        }
      });

      setTimeout(function() {
        client.publish({
          topic: f.t(),
          payload: f.p()
        });
      }, 1600 * global.speed);

      setTimeout(function(){
        ok = true;
        client.disconnect();
      }, 2200 * global.speed);
    }, done);
  });

  it('should send last will if requested (MQTT-3.1.2-8, MQTT-3.1.2-10, MQTT-3.1.2-14)', function(done){
    var d = f.countDone(2, done);
    var t = f.t();
    var p = f.p();

    f.client({
      will: {
        topic: t,
        payload: p
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(topic, payload, packet){
          expect(topic).to.be.eql(t);
          expect(payload.toString()).to.be.eql(p);
          client2.end();
        });
        client2.subscribe(t, function(){
          client1.stream.end();
        });
      }, d);
    }, d);
  });

  it('should not send will on proper disconnect (MQTT-3.14.4-3)', function(done){
    var d = f.countDone(2, done);
    var t = f.t();
    var p = f.p();

    f.client({
      will: {
        topic: t,
        payload: p
      }
    }, function(client1){
      f.client(function(client2){
        client2.on('message', function(topic){
          if(topic == t) {
            throw new Error('this message should not have been published');
          }
        });
        client2.subscribe(t, function(){
          client1.end();
          client2.end();
        });
      }, d);
    }, d);
  });
});
