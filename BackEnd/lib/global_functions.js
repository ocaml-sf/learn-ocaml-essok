const before_token_regexp1 = '';
const before_token_regexp1_len = before_token_regexp1.length;
const before_token_regexp2 = 'Found the following teacher tokens:\n  - ';
const before_token_regexp2_len = before_token_regexp2.length;
const token_len = 17;

function _asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

function _findTeacherToken(log) {
    var index = log.indexOf(before_token_regexp2);
    if(index === -1)
	return undefined;
    return log.substr(index + before_token_regexp2_len, token_len);
}

var global_functions = {
    asyncFunction: _asyncFunction,
    findTeacherToken: _findTeacherToken
}

module.exports = global_functions;
