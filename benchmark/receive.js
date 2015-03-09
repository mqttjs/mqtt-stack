var mqtt = require('mqtt');

var counter = 0;
var interval = 5000;

function count() {
  console.log('received/s', counter / interval * 1000);
  counter = 0;
}

setInterval(count, interval);

var client = mqtt.connect({
  port: process.env['PORT'] || 1883,
  host: 'localhost',
  clean: true,
  keepalive: 0,
  encoding: 'binary'
});

client.on('connect', function() {
  console.log('connected!');

  client.subscribe('test', function(){
    console.log('subscribed!');
  });

  client.on('message', function() {
    counter++;
  });
});

client.on('close', function() {
  process.exit();
});

