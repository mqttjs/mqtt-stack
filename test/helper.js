var dotenv = require('dotenv');

process.env.NODE_ENV = 'test';
dotenv.load();

var Broker = require('./support/broker');

var broker;

before(function(done){
  broker = new Broker();
  broker.listen(process.env['PORT'], done)
});

after(function(){
  broker.destroy();
});
