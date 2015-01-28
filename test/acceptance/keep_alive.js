var f = require('../support/factory');

describe('KeepAlive', function(){
  it('should terminate connection when ping is missing', function(done){
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
});
