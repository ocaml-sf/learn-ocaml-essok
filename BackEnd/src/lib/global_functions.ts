export const tokenObj = {
  regexps: [
    'Initial teacher token created: ',
    'Found the following teacher tokens:\n  - ',
  ],
  length: 17,
  errorNotFound: 'Token not found',
};

export function asyncFunction(item : any, cb : Function) {
  setTimeout(() => {
    console.log('done with', item);
    cb();
  }, 100);
}

/**
 * create a Promise that wait before returning result
 * callback must be a function that take no arguments (only unit)
 */
export async function timedRun(callback : Function, ms : number) {
  let result = await new Promise(resolve => {
    setTimeout(() => resolve(callback()), ms);
  });
  return result;
}

async function tryFindTeacherToken(log : string,
  regexp : string, regexpLen : number) {
  var index = log.indexOf(regexp);
  if (index === -1)
    throw tokenObj.errorNotFound;
  return log.substr(index + regexpLen, tokenObj.length);
}

export async function tryAllFindTeacherToken(log : any) {
  async function tryFindIter(regexps : string[]) : Promise<string> {
    let regexp = regexps[0];

    return tryFindTeacherToken(log, regexp, regexp.length)
      .catch(err => {
        if (err === tokenObj.errorNotFound && regexps.length > 1)
          return tryFindIter(regexps.slice(1));
        else
          throw err;
      });
  }
  return tryFindIter(tokenObj.regexps);
}
