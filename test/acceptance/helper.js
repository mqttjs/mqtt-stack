if(!process.env.PORT) {
  process.env.PORT = 9000;
}

var FakeBroker = require('./../support/fake_broker');

var broker;

before(function(done){
  broker = new FakeBroker(process.env['PORT']);
  broker.listen(done)
});

after(function(){
  broker.close();
});
