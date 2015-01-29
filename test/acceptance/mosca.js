var expect = require('expect.js');
var async = require('async');
var mqtt = require('mqtt');

var f = require('../support/factory');

describe('Imported Mosca Tests', function(){
  /*it('should support unsubscribing a single client', function(done) {
    var d = donner(3, done);

    async.waterfall([

      function(cb) {
        buildAndConnect(d, function(client1) {
          cb(null, client1);
        });
      },

      function(client1, cb) {
        var called = false;
        client1.on('publish', function(packet) {
          // we are expecting this
          client1.disconnect();
        });

        var subscriptions = [{
          topic: 'hello/#',
          qos: 0
        }
        ];

        client1.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });
        client1.on('suback', function() {
          cb(null, client1);
        });
      },

      function(client1, cb) {
        buildAndConnect(d, function(client3) {
          cb(null, client1, client3);
        });
      },

      function(client1, client3, cb) {
        var subscriptions = [{
          topic: 'hello/#',
          qos: 0
        }
        ];
        client3.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });
        client3.on('suback', function() {
          client3.disconnect();
          cb(null);
        });
      },

      function(cb) {
        buildAndConnect(d, function(client2) {
          cb(null, client2);
        });
      },

      function(client2, cb) {
        client2.publish({
          topic: 'hello/world',
          payload: 'some data'
        });
        client2.disconnect();
      }
    ]);
  });*/

  it('should support send a puback when publishing QoS 1 messages', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);
      var messageId = f.mid();

      client.on('puback', function(packet) {
        expect(packet).to.have.property('messageId', messageId);
        client.disconnect();
      });

      client.publish({
        topic: 'hello',
        qos: 1,
        messageId: messageId
      });
    }, done);
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

  it('should receive all messages at QoS 1 if a subscription is done with QoS 0', function(done) {
    f.client(function(client){
      client.once('message', function(_, __, packet) {
        expect(packet.qos).to.be.eql(0);
        client.end();
      });

      client.subscribe('hello', function(){
        client.publish('hello', 'hello', 1);
      });
    }, done);
  });

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

  it('should support authentication (success)', function(done) {
    instance.authenticate = function(client, username, password, callback) {
      expect(username.toString()).to.be.eql('matteo');
      expect(password.toString()).to.be.eql('collina');
      callback(null, true);
    };

    buildClient(done, function(client) {

      var options = buildOpts();
      options.username = 'matteo';
      options.password = 'collina';

      client.connect(options);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(0);
        client.disconnect();
      });
    });
  });

  it('should support authentication (failure)', function(done) {
    instance.authenticate = function(client, username, password, callback) {
      expect(username.toString()).to.be.eql('matteo');
      expect(password.toString()).to.be.eql('collina');
      callback(null, false);
    };

    buildClient(done, function(client) {

      var options = buildOpts();
      options.username = 'matteo';
      options.password = 'collina';

      client.connect(options);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(5);
      });
    });
  });

  it('should support authentication (error)', function(done) {
    instance.authenticate = function(client, username, password, callback) {
      callback(new Error('auth error'));
    };

    buildClient(done, function(client) {

      var options = buildOpts();
      options.username = 'matteo';
      options.password = 'collina';

      client.connect(options);

      client.on('connack', function(packet) {
        expect(packet.returnCode).to.eql(4);
      });
    });
  });

  it('should support publish authorization (success)', function(done) {
    instance.authorizePublish = function(client, topic, payload, callback) {
      expect(topic).to.be.eql('hello');
      expect(payload.toString()).to.be.eql('world');
      callback(null, true);
    };

    buildAndConnect(done, function(client) {

      var messageId = Math.floor(65535 * Math.random());

      client.on('puback', function(packet) {
        expect(packet).to.have.property('messageId', messageId);
        client.disconnect();
      });

      client.publish({
        topic: 'hello',
        qos: 1,
        payload: 'world',
        messageId: messageId
      });
    });
  });

  it('should support publish authorization (failure)', function(done) {
    instance.authorizePublish = function(client, topic, payload, callback) {
      expect(topic).to.be.eql('hello');
      expect(payload.toString()).to.be.eql('world');
      callback(null, false);
    };

    buildAndConnect(done, function(client) {

      // it exists no negation of auth, it just disconnect the client
      client.publish({
        topic: 'hello',
        payload: 'world',
        qos: 1,
        messageId: 42
      });
    });
  });

  it('should support will authorization (success)', function(done) {
    instance.authorizePublish = function(client, topic, payload, callback) {
      expect(topic).to.be.eql('hello');
      expect(payload.toString()).to.be.eql('world');
      callback(null, true);
    };

    var opts = buildOpts();

    opts.will = {
      topic: 'hello',
      payload: 'world'
    };

    buildAndConnect(function() {}, opts, function(client) {
      client.stream.end();
    });

    instance.on('published', function(packet) {
      expect(packet.topic).to.be.eql('hello');
      expect(packet.payload.toString()).to.be.eql('world');
      done();
    });
  });

  it('should support will authorization (failure)', function(done) {
    instance.authorizePublish = function(client, topic, payload, callback) {
      expect(topic).to.be.eql('hello');
      expect(payload.toString()).to.be.eql('world');
      callback(null, false);
      done();
    };

    var opts = buildOpts();

    opts.will = {
      topic: 'hello',
      payload: 'world'
    };

    buildAndConnect(function() {}, opts, function(client) {
      client.stream.end();
    });
  });

  it('should support subscribe authorization (success)', function(done) {
    instance.authorizeSubscribe = function(client, topic, callback) {
      expect(topic).to.be.eql('hello');
      callback(null, true);
    };

    buildAndConnect(done, function(client) {

      client.on('suback', function(packet) {
        client.disconnect();
      });

      var subscriptions = [{
        topic: 'hello',
        qos: 0
      }
      ];

      client.subscribe({
        subscriptions: subscriptions,
        messageId: 42
      });
    });
  });

  it('should support subscribe authorization (failure)', function(done) {
    var d = donner(2, done);

    instance.authorizeSubscribe = function(client, topic, callback) {
      expect(topic).to.be.eql('hello');
      callback(null, false);
    };

    buildAndConnect(d, function(client) {

      var subscriptions = [{
        topic: 'hello',
        qos: 0
      }
      ];

      client.on('suback', function(packet) {
        expect(packet.granted).to.be.eql([0x80]);
        client.disconnect();
        d();
      });

      client.subscribe({
        subscriptions: subscriptions,
        messageId: 42
      });
    });
  });

  it('should support retained messages', function(done) {

    async.waterfall([

      function(cb) {
        var client = mqtt.createConnection(process.env['PORT'], 'localhost');

        client.on('connected', function() {
          var opts = buildOpts();

          client.connect(opts);

          client.on('connack', function(packet) {
            client.publish({
              topic: 'hello',
              qos: 1,
              payload: new Buffer('world world'),
              messageId: 42,
              retain: true
            });
          });

          client.on('puback', function() {
            client.stream.end();
            cb();
          });
        });
      },

      function(cb) {
        var client = mqtt.createConnection(process.env['PORT'], 'localhost');

        client.on('connected', function() {
          var opts = buildOpts();

          client.connect(opts);

          client.on('connack', function(packet) {
            var subscriptions = [{
              topic: 'hello',
              qos: 0
            }];

            client.subscribe({
              subscriptions: subscriptions,
              messageId: 29
            });
          });

          client.on('publish', function(packet) {
            expect(packet.topic).to.be.eql('hello');
            expect(packet.payload.toString()).to.be.eql('world world');
            client.stream.end();
          });

          client.stream.on('end', cb);
        });
      }
    ], function() {
      setImmediate(done);
    });
  });

  it('should return only a single retained message', function(done) {

    async.waterfall([

      function(cb) {
        buildClient(cb, function(client) {

          client.name = 'Phase 1';
          var defaultMessage = {
            topic: 'hello',
            qos: 1,
            payload: null,
            messageId: null,
            retain: true
          };

          var opts = buildOpts();
          opts.clean = true;

          var totalMessages = 3;
          var publishCount = 0;

          client.connect(opts);

          client.on('puback', function(packet){
            publishCount++;
            if(publishCount == totalMessages) {
              client.stream.end();
            }
          });

          client.on('connack', function(packet) {
            for(var c = 1; c <= totalMessages; c++) {
              defaultMessage.payload = (c == totalMessages) ? new Buffer('Final Message') : new Buffer('Message ' + c);
              defaultMessage.messageId = 40 + c;
              client.publish(defaultMessage);
            }
          });
        });
      },

      function(cb) {
        setTimeout(cb, 100);
      },

      function(cb) {
        buildClient(cb, function(client) {
          var retainedReceivedCount = 0;

          var opts = buildOpts();
          opts.clean = true;

          client.connect(opts);

          client.on('connack', function(packet) {
            var subscriptions = [{
              topic: 'hello',
              qos: 0
            }];

            client.subscribe({
              subscriptions: subscriptions,
              messageId: 20
            });
          });

          var handleTimeout = function() {
            expect(retainedReceivedCount).to.be.equal(1);
            client.stream.end();
          };

          var timeout;

          client.on('publish', function(packet) {
            clearTimeout(timeout);
            timeout = setTimeout(handleTimeout, 100);
            retainedReceivedCount++;
          });
        });
      }
    ], done);
  });

  it('should restore subscriptions for uncleaned clients', function(done) {
    var opts = buildOpts();

    opts.clientId = 'mosca-unclean-clients-test';
    opts.clean = false;

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
            client.stream.end();
          });
        });
      },

      function(cb) {
        buildAndConnect(cb, opts, function(client) {
          client.publish({
            topic: 'hello',
            qos: 1,
            payload: 'world',
            messageId: 42
          });

          client.on('publish', function(packet) {
            expect(packet.topic).to.be.eql('hello');
            expect(packet.payload).to.be.eql('world');
            expect(packet.qos).to.be.eql(1);
            client.disconnect();
          });
        });
      }
    ], done);
  });

  it('should restore subscriptions for uncleaned clients (bis)', function(done) {
    var opts = buildOpts();

    opts.clientId = 'mosca-unclean-client-test';
    opts.clean = false;

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
            client.stream.end();
          });
        });
      },

      function(cb) {
        buildAndConnect(cb, buildOpts(), function(client) {
          client.publish({
            topic: 'hello',
            qos: 1,
            payload: 'world',
            messageId: 24
          });
          client.on('puback', function() {
            client.disconnect();
          });
        });
      },

      function(cb) {
        buildAndConnect(cb, opts, function(client) {
          client.on('publish', function(packet) {
            expect(packet.topic).to.be.eql('hello');
            expect(packet.payload).to.be.eql('world');
            client.disconnect();
          });
        });
      }
    ], done);
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
  });

  describe('pattern matching', function() {

    var buildTest = function(subscribed, published, expected) {
      var not = '';

      if (expected === undefined) {
        expected = true;
      }

      if (!expected) {
        not = 'not ';
      }

      if (!(subscribed instanceof Array)) {
        subscribed = [subscribed];
      }

      it('should ' + not + 'support forwarding to ' + subscribed + ' when publishing ' + published, function(done) {
        var d = donner(2, done);
        buildAndConnect(d, function(client1) {

          var messageId = Math.floor(65535 * Math.random());
          var subscriptions = subscribed.map(function(topic) {
            return {
              topic: topic,
              qos: 0
            };
          });

          client1.on('publish', function(packet) {
            client1.disconnect();
            if (!expected) {
              throw new Error('the message was not expected');
            }
          });

          client1.on('suback', function() {
            buildAndConnect(d, function(client2) {
              client2.publish({
                topic: published,
                payload: 'some data',
                messageId: messageId
              });
              client2.disconnect();
            });
          });

          client1.subscribe({
            subscriptions: subscriptions,
            messageId: messageId
          });

          if (!expected) {
            setTimeout(function() {
              client1.disconnect();
            }, 50);
          }
        });
      });
    };

    buildTest('#', 'test/topic');
    buildTest('#', '/test/topic');
    buildTest('foo/#', 'foo/bar/baz');
    buildTest('foo/+/baz', 'foo/bar/baz');
    buildTest('foo/#', 'foo');
    buildTest('/#', '/foo');
    buildTest('test/topic/', 'test/topic', false);
    buildTest('+/+/+/+/+/+/+/+/+/+/test', 'one/two/three/four/five/six/seven/eight/nine/ten/test');
    buildTest('/test/topic', 'test/topic', false);
    buildTest('/test//topic', '/test/topic', false);
    buildTest('/test//topic', '/test//topic');
    buildTest('/test/+/topic', '/test//topic', false);
    buildTest('/test/#/topic', '/test//topic');
    buildTest('#', '$SYS/hello', false);
    buildTest('/#', '$SYS/hello', false);
    buildTest('/+/hello', '$SYS/hello', false);
    buildTest('$SYS/hello', '$SYS/hello');
    buildTest('$SYS/hello', '$SYS/hello');
    buildTest(['#', '$SYS/#'], '$SYS/hello');
  });

  it("should support subscribing with overlapping topics and receiving message only once", function(done) {
    var d = donner(2, done);
    var that = this;
    buildAndConnect(d, this.instance, buildOpts(), function(client1) {

      var messageId = Math.floor(65535 * Math.random());
      var subscriptions = [{
        topic: "a/+",
        qos: 1
      }, {
        topic: "+/b",
        qos: 1
      }, {
        topic: "a/b",
        qos: 1
      }
      ];
      var called = 0;

      client1.on("publish", function(packet) {
        client1.puback({ messageId: packet.messageId });
        expect(packet.topic).to.equal("a/b");
        expect(packet.payload).to.equal("some other data");
        expect(called++).to.equal(0);
      });

      client1.on("suback", function() {
        buildAndConnect(d, that.instance, buildOpts(), function(client2) {

          client2.on("puback", function() {
            client1.disconnect();
            client2.disconnect();
          });

          client2.publish({
            topic: "a/b",
            payload: "some other data",
            messageId: messageId,
            qos: 1
          });
        });
      });

      client1.subscribe({
        subscriptions: subscriptions,
        messageId: messageId
      });
    });
  });

  it("should support subscribing correctly to wildcards in a tree-based topology", function(done) {
    var d = donner(3, done);

    async.waterfall([

      function(cb) {
        settings.backend = {
          port: settings.port,
          type: "mqtt"
        };
        settings.port = nextPort();
        secondInstance = new mosca.Server(settings, function() {
          cb();
        });
      },

      function(cb) {
        buildAndConnect(d, function(client1) {
          cb(null, client1);
        });
      },

      function(client1, cb) {
        var called = false;
        client1.on("publish", function(packet) {
          expect(called).to.be.eql(false);
          called = true;
          setTimeout(function() {
            client1.disconnect();
          });
        });

        var subscriptions = [{
          topic: "hello/#",
          qos: 0
        }
        ];
        client1.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });

        client1.on("suback", function() {
          cb(null);
        });
      },

      function(cb) {
        buildAndConnect(d, function(client3) {
          cb(null, client3);
        });
      },

      function(client3, cb) {
        var subscriptions = [{
          topic: "hello/#",
          qos: 0
        }
        ];
        client3.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });
        client3.on("suback", function() {
          // we need to simulate a "stuck" subscription
          client3.stream.end();
          cb(null);
        });
      },

      function(cb) {
        buildAndConnect(d, function(client2) {
          cb(null, client2);
        });
      },

      function(client2, cb) {
        client2.publish({
          topic: "hello/world",
          payload: "some data"
        });
        client2.disconnect();
      }
    ]);
  });

  it("should not wrap messages with \"\" in a tree-based topology", function(done) {
    var d = donner(2, done);

    async.waterfall([

      function(cb) {
        buildAndConnect(d, function(client1) {
          cb(null, client1);
        });
      },

      function(client1, cb) {
        client1.on("publish", function(packet) {
          expect(packet.payload).to.be.eql("some data");
          client1.disconnect();
        });

        var subscriptions = [{
          topic: "hello/#",
          qos: 0
        }
        ];

        client1.subscribe({
          subscriptions: subscriptions,
          messageId: 42
        });
        client1.on("suback", function() {
          cb(null);
        });
      },

      function(cb) {
        settings.backend = {
          port: settings.port,
          type: "mqtt"
        };
        settings.port = settings.port + 1000;
        secondInstance = new mosca.Server(settings, function() {
          cb();
        });
      },

      function(cb) {
        buildAndConnect(d, function(client2) {
          cb(null, client2);
        });
      },

      function(client2, cb) {
        client2.publish({
          topic: "hello/world",
          payload: "some data"
        });
        client2.disconnect();
      }
    ]);
  });*/
});
