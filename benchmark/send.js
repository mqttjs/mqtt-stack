var mqtt = require('mqtt');

var port = process.env['PORT'] || 1883;

var counter = 0;
var interval = 5000;

function count() {
  console.log('[send]', Math.round(counter / interval * 1000), 'msg/s');
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

function immediatePublish() {
  setImmediate(publish);
}

function publish() {
  counter++;
  client.publish('test', 'payload', immediatePublish);
}

client.on('connect', function(){
  console.log('[send] connected to', port);
  publish();
});

client.on('close', function() {
  process.exit();
});
