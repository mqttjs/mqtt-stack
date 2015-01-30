describe('Session', function(){
  it('should restore subscriptions for uncleaned clients', function(done) {
    async.series([
      function(cb) {
        f.client({
          clientId: 'unclean-client',
          clean: false
        }, function(client){
          client.subscribe('hello', { qos: 1 }, function(){
            client.end();
          });
        }, cb);
      },
      function(cb) {
        f.client({
          clientId: 'unclean-client',
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
