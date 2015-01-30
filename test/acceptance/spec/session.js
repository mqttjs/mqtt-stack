var expect = require('expect.js');
var async = require('async');

var f = require('../../support/factory');

describe('Session', function(){
  it('should restore subscriptions for uncleaned clients', function(done) {
    var cid = f.cid();
    async.series([
      function(cb) {
        f.client({
          clientId: cid,
          clean: false
        }, function(client){
          client.subscribe('hello', { qos: 1 }, function(){
            client.end();
          });
        }, cb);
      },
      function(cb) {
        f.client({
          clientId: cid,
          clean: false
        }, function(client){
          client.on('message', function(topic, payload, packet){
            expect(topic).to.be.eql('hello');
            expect(payload.toString()).to.be.eql('world');
            expect(packet.qos).to.be.eql(1);
            client.end();
          });
          client.publish('hello', 'world', { qos: 1 });
        }, cb);
      }
    ], done);
  });
});
