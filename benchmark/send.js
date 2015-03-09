var mqtt = require('mqtt');

var counter = 0;
var interval = 5000;

function count() {
  console.log('counter/s', counter / interval * 1000);
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

function immediatePublish() {
  setImmediate(publish);
  //setTimeout(publish, 1);
}

function publish() {
  counter++;
  client.publish('test', 'payload', immediatePublish);
}

client.on('connect', function(){
  console.log('connected!');
  publish();
});

client.on('close', function() {
  process.exit();
});
