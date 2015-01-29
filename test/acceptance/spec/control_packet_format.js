var f = require('../../support/factory');

describe('Control Packet Format', function(){
  it('should close client on corrupt packet (MQTT-2.0.0-1)', function(done){
    f.rawClient(function(client){
      client.stream.write("\x00\x00\x00\x00\x00\x00");
    }, done);
  });
});
