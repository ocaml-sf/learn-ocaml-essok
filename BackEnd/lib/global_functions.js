const token_regexp1 = 'Initial teacher token created: ';
const token_regexp1_len = token_regexp1.length;
const token_regexp2 = 'Found the following teacher tokens:\n  - ';
const token_regexp2_len = token_regexp2.length;
const token_len = 17;

function _asyncFunction(item, cb) {
    setTimeout(() => {
        console.log('done with', item);
        cb();
    }, 100);
}

function _tryFindTeacherToken(log, regexp, regexp_len) {
    var index = log.indexOf(regexp);
    if(index === -1)
	return undefined;
    return log.substr(index + regexp_len, token_len);
}

function _tryAllFindTeacherToken(log) {
    var try1 = _tryFindTeacherToken(log, token_regexp1, token_regexp1_len);
    if(try1 !== undefined)
	return try1;
    return _tryFindTeacherToken(log, token_regexp2, token_regexp2_len);
}

var global_functions = {
    asyncFunction: _asyncFunction,
    tryFindTeacherToken: _tryAllFindTeacherToken
}

module.exports = global_functions;
