module.exports.mockExecute = function (middleware, config) {
    middleware.stack = {
        execute: function (fn, ctx, store, cb) {
            if (typeof store === 'function') {
                cb = store;
                store = null;
            }

            if (store) {
                config[fn](ctx, store, cb);
            } else {
                config[fn](ctx, cb);
            }
        }
    };
};
