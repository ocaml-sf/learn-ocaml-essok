function _asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

var global_functions = {
    asyncFunction: _asyncFunction,
}

module.exports = global_functions;
