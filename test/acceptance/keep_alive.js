var net = require('net');
var mqtt = require('mqtt-connection');

describe('KeepAlive', function(){
  it('should terminate connection when ping is missing', function(done){
    this.timeout(3000);

    var conn = net.createConnection(process.env['PORT'], '0.0.0.0', function(){
      var client = mqtt(conn);

      client.connect({
        keepalive: 1,
        clientId: 'test1'
      });

      conn.on('close', function(){
        done();
      })
    });
  });
});
