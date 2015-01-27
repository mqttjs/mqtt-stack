/**
 * Timer Class
 *
 * - manages a setTimout timer
 *
 * @param {Number} timeout
 * @param {Function} callback
 */

var Timer = function(timeout, callback) {
  this.timeout = timeout;
  this.callback = callback;
  this.start();
};

Timer.prototype.start = function() {
  var self = this;
  if (this.timeout > 0) {
    this.timer = setTimeout(function(){
      self.callback();
    }, this.timeout);
  }
};

Timer.prototype.clear = function() {
  if (this.timeout > 0) {
    clearTimeout(this.timer);
  }
};

Timer.prototype.reset = function() {
  this.clear();
  this.start();
};

module.exports = Timer;
