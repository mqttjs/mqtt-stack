var mqtt = require('mqtt');

var port = process.env['PORT'] || 1883;

var counter = 0;
var interval = 5000;

function count() {
  console.log('[recv]', Math.round(counter / interval * 1000), 'msg/s');
  counter = 0;
}

setInterval(count, interval);

var client = mqtt.connect({
  port: port,
  host: 'localhost',
  clean: true,
  keepalive: 0,
  encoding: 'binary'
});

client.on('connect', function() {
  console.log('[recv] connected to', port);

  client.subscribe('test', function(){
    console.log('[recv] subscribed');
  });

  client.on('message', function() {
    counter++;
  });
});

client.on('close', function() {
  process.exit();
});

