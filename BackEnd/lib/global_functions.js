function _asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

var global_functions = {
    asyncFunction: function (item, cb) {
        return _asyncFunction(item, cb);
    },
}

module.exports = global_functions;
