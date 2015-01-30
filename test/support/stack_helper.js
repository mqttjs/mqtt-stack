module.exports.executeOnSelf = function(middleware) {
  middleware.stack = {
    execute: function(fn, args, cb){
      middleware.config[fn](args, cb);
    }
  };
};
