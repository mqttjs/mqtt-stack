var f = require('../../support/factory');

describe('Controll Packet Connect', function(){
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
});
