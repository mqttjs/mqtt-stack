"use strict";
/**
 * Timer Class
 *
 * - manages a setTimout timer
 */
class Timer {
    /**
     * constructor
     *
     * @param {Number} timeout
     * @param {Function} callback
     */
    constructor(timeout, callback) {
        this.timeout = timeout;
        this.callback = callback;
        this.start();
    }

    start() {
        let self = this;
        if (this.timeout > 0) {
            this.timer = setTimeout(function () {
                self.callback();
            }, this.timeout);
        }
    }

    clear() {
        if (this.timeout > 0) {
            clearTimeout(this.timer);
        }
    }

    reset() {
        this.clear();
        this.start();
    }
}

module.exports = Timer;
