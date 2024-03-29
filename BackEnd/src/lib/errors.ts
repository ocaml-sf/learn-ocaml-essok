export default {

  wget_error: function (code : number) {
    var message = '';
    switch (code) {
    case 4:
      message = 'Network Failure'
      break;
    case 5:
      message = 'SSL verification failure.'
      break;
    case 7:
      message = 'Protocol errors.'
      break;
    case 8:
      message = 'Server issued an error response.'
      break;
    default:
      message = 'Error unknown.'
      break;
    }
    return message;
  },

  group_duplicate: function (files : any) {
    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        if (files[i][0] === files[j][0]) {
          return true;
        } else {
          console.log('not found : ' + files[i][0] + ' ' + files[j][0]);
          if (i === files.length - 1) {
            return false;
          }
        }
      }
    }

  },

  wrap_error: function (fun : any, status : any, err : any) {
    if (err.fun === undefined) {
      throw { fun, status, err };
    } else {
      throw err;
    }
  },

  unwrap_error: function (res : any, err : any) {
    if (err.fun !== undefined) {
      console.log('Error ' + err.fun + ': ');
      console.log(err.err);
      res.status(err.status).json({ errors: { errors: err.err.message } });
    } else {
      throw err;
    }
  }
};
