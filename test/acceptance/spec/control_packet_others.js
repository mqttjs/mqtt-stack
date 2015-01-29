var f = require('../../support/factory');

describe('Control Packet Others', function(){
  it('should send a pingresp when it receives a pingreq (MQTT-3.12.4-1)', function(done) {
    f.rawClient(function(client, opts){
      client.connect(opts);

      client.on('pingresp', function() {
        client.disconnect();
      });

      client.pingreq();
    }, done);
  });
});
