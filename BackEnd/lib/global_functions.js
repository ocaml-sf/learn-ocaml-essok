const tokenObj = {
    regexps: [
        'Initial teacher token created: ',
        'Found the following teacher tokens:\n  - ',
    ],
    length: 17,
    errorNotFound: 'Token not found',
};

function _asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

/**
 * create a Promise that wait before returning result
 * callback must be a function that take no arguments (only unit)
 */
async function _timedRun(callback, ms) {
    let result = await new Promise(resolve => {
        setTimeout(() => resolve(callback()), ms);
    });
    return result;
}

async function _tryFindTeacherToken(log, regexp, regexpLen) {
    var index = log.indexOf(regexp);
    if (index === -1)
        throw tokenObj.errorNotFound;
    return log.substr(index + regexpLen, tokenObj.length);
}

async function _tryAllFindTeacherToken(log) {
    async function _tryFindIter(regexps) {
        let regexp = regexps[0];

        return _tryFindTeacherToken(log, regexp, regexp.length)
            .catch(err => {
                if (err === tokenObj.errorNotFound && regexps.length > 1)
                    return _tryFindIter(regexps.slice(1));
                else
                    throw err;
            });
    }
    return _tryFindIter(tokenObj.regexps);
}

var global_functions = {
    tokenObj,
    asyncFunction: _asyncFunction,
    tryFindTeacherToken: _tryAllFindTeacherToken,
    timedRun: _timedRun
};

module.exports = global_functions;
