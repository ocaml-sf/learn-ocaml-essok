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

function _findTeacherToken(log, regexp, regexp_len) {
    var index = log.indexOf(regexp);
    if(index === -1)
	return undefined;
    return log.substr(index + regexp, token_len);
}

function _findTeacherToken(log) {
    var try1 = _findTeacherToken(log, token_regexp1, token_regexp1_len);
    if(try1 === undefined)
	return _findTeacherToken(log, token_regexp2, token_regexp2_len);
}

var global_functions = {
    asyncFunction: _asyncFunction,
    findTeacherToken: _findTeacherToken
}

module.exports = global_functions;
