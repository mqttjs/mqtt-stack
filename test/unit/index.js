var assert = require('assert');
var _ = require('underscore');

describe('Index', function(){
  it('should expose classes', function(){
    _.each(require('../../index'), function(module){
      assert(typeof module  == 'function');
    });
  });
});
