"use strict";
let _ = require('underscore');
/**
 * Base class that all middlewares should extend
 */

class Middleware {
    constructor(config, defaults) {
        this.name = this.constructor.name;
        this.config = _.defaults(config || {}, defaults || {});
    }

    handle(client, packet, next) {
        next();
    }
}

module.exports = Middleware;
