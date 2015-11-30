module.exports.mockExecute = function (middleware, config) {
    middleware.stack = {
        execute: function (fn, ctx, store, cb) {
            if (typeof store === 'function' && typeof cb === 'undefined') {
                cb = store;
                store = null;
            }

            config[fn](ctx, store, cb);
        }
    };
};
