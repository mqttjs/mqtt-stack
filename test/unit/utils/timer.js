var Timer = require('../../../src/utils/timer');

describe('Timer', function () {
    it('should call callback', function (done) {
        var timer = new Timer(1, function () {
            timer.clear();
            done();
        });
        timer.start();
    });
});
