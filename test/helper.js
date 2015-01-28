var dotenv = require('dotenv');

process.env.NODE_ENV = 'test';
dotenv.load();

var FakeBroker = require('./support/fake_broker');

var broker;

before(function(done){
  broker = new FakeBroker(process.env['PORT']);
  broker.listen(done)
});

after(function(){
  broker.close();
});
