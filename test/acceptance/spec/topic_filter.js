var f = require('../../support/factory');

var buildTest = function(subscribed, published, expected) {
  var not = '';

  if(expected === undefined) {
    expected = true;
  }

  if(!expected) {
    not = 'not ';
  }

  it('should ' + not + 'support forwarding to ' + subscribed + ' when publishing ' + published, function(done) {
    var d = f.countDone(2, done);

    f.client(function(client1){
      client1.on('message', function() {
        client1.end();
        if (!expected) {
          throw new Error('the message was not expected');
        }
      });

      client1.subscribe(subscribed, function(){
        f.client(function(client2){
          client2.publish(published, f.p());
          client2.end();
        }, d);
      });

      if (!expected) {
        setTimeout(function() {
          client1.end();
        }, 50);
      }
    }, d);
  });
};

/**
 * Topic filter related tests that check the support of proper wildcards.
 * This should be implemented by all brokers the same way.
 */
describe('Topic Filter', function(){
  // (MQTT-4.7.1-1, MQTT-4.7.1-2, MQTT-4.7.1-3)
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
  buildTest('/test/+/topic', '/test//topic');
  buildTest('/test//topic', '/test//topic');
});
