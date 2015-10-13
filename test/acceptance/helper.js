global.port = 9000;

if(process.env['PORT']) {
  global.port = process.env['PORT'];
}

global.hostname = '0.0.0.0';

if(process.env['HOSTNAME']) {
  global.hostname = process.env['HOSTNAME'];
}

global.speed = 0.01;

if(process.env['NORMAL_SPEED']) {
  global.speed = 1;
}

var broker;

if(!process.env['EXTERN']) {
  var FakeBroker = require('./../support/fake_broker');

  before(function(done){
    broker = new FakeBroker(global.port);
    broker.listen(done)
  });

  after(function(){
    broker.close();
  });
}
