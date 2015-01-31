var expect = require('expect.js');
var async = require('async');
var mqtt = require('mqtt');

var f = require('../support/factory');

describe('Imported Mosca Tests', function(){
  /*function maxInflightMessageTest(max, done) {
    buildAndConnect(done, function (client) {

      var counter = max + 1;

      function doPublish() {
        if (counter-- === 0) {
          return;
        }

        client.publish({
          topic: 'hello/foo',
          qos: 1,
          messageId: counter
        });

        setImmediate(doPublish);
      }

      // we are not replaying with any pubacks

      client.on('suback', function(packet) {
        doPublish();
      });

      var subscriptions = [{
        topic: 'hello/#',
        qos: 1
      }];

      client.subscribe({
        subscriptions: subscriptions,
        messageId: 42
      });
    });
  }

  it('should disconnect a client if it has more thant 1024 inflight messages', function (done) {
    maxInflightMessageTest(1024, done);
  });

  it('should remove already pubacked messages from the offline store', function(done) {
    var opts = buildOpts();

    opts.clientId = 'mosca-unclean-clients-test';
    opts.clean = false;
    opts.keepalive = 0;

    function step1(cb) {
      buildAndConnect(function() {}, opts, function(client) {
        var subscriptions = [{
          topic: 'hello',
          qos: 1
        }];

        client.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });

        client.on('suback', function() {
          cb(null, client);
        });
      });
    }

    function step2(subscriber, cb) {
      buildAndConnect(function() {}, buildOpts(), function(client) {
        cb(null, subscriber, client);
      });
    }

    function step3(subscriber, publisher, cb) {
      publisher.publish({
        topic: 'hello',
        qos: 1,
        payload: 'world',
        messageId: 42
      });

      publisher.on('puback', function(packet) {
        publisher.disconnect();
      });

      subscriber.on('publish', function(packet) {
        subscriber.puback({ messageId: packet.messageId });
        subscriber.disconnect();
        cb();
      });
    }

    async.waterfall([
      step1, step2, step3,
      // two times!
      step1, step2, step3
    ], function(err) {

      expect(err).to.be.falsy;

      buildClient(done, function(client) {
        client.connect(opts);

        client.on('publish', function(packet) {
          done(new Error('not expected'));
        });

        setTimeout(function() {
          client.disconnect();
        }, 100);
      });
    });
  });

  it('should support offline messaging', function(done) {
    var opts = buildOpts();

    opts.clientId = 'mosca-unclean-clients-test2';
    opts.clean = false;
    opts.keepalive = 0;

    async.series([

      function(cb) {
        buildAndConnect(cb, opts, function(client) {
          var subscriptions = [{
            topic: 'hello',
            qos: 1
          }];

          client.subscribe({
            subscriptions: subscriptions,
            messageId: 42
          });

          client.on('suback', function() {
            client.disconnect();
          });
        });
      },

      function(cb) {
        buildClient(cb, function(client) {
          client.connect(buildOpts());

          client.publish({
            topic: 'hello',
            qos: 1,
            payload: 'world',
            messageId: 42
          });

          client.on('puback', function(packet) {
            client.disconnect();
          });
        });
      },

      function(cb) {
        buildAndConnect(cb, opts, function(client) {

          client.on('publish', function(packet) {
            client.puback({ messageId: packet.messageId });
            client.disconnect();

            expect(packet.topic).to.eql('hello');
            expect(packet.payload).to.eql('world');
            expect(packet.qos).to.eql(1);
          });
        });
      }
    ], done);
  });

  it('should not deliver all offline messages more than once', function(done) {
    var opts = buildOpts();

    opts.clientId = 'mosca-unclean-clients-test3';
    opts.clean = false;
    opts.keepalive = 0;

    async.series([

      function(cb) {
        buildAndConnect(cb, opts, function(client) {
          var subscriptions = [{
            topic: 'hello',
            qos: 1
          }];

          client.subscribe({
            subscriptions: subscriptions,
            messageId: 42
          });

          client.on('suback', function() {
            client.disconnect();
          });
        });
      },

      function(cb) {
        buildClient(cb, function(client) {
          client.connect(buildOpts());

          client.publish({
            topic: 'hello',
            qos: 1,
            payload: 'world',
            messageId: 42
          });

          client.on('puback', function(packet) {
            client.disconnect();
          });
        });
      },

      function(cb) {
        buildAndConnect(cb, opts, function(client) {

          client.on('publish', function(packet) {
            client.puback({ messageId: packet.messageId });
            client.disconnect();

            expect(packet.topic).to.eql('hello');
            expect(packet.payload).to.eql('world');
            expect(packet.qos).to.eql(1);
          });
        });
      },

      function(cb) {
        setTimeout(cb, 100);
      },

      function(cb) {
        buildAndConnect(cb, opts, function(client) {

          client.on('publish', function(packet) {
            cb(new Error('unexpected publish'));
          });

          setTimeout(function() {
            client.disconnect();
          }, 50);
        });
      }
    ], done);
  });*/
});
