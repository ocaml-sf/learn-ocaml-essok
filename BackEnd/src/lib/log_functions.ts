import { Log } from 'models'

export function create(type : any, action : any, message : any = null, author : any = null, server : any = null) {
  return new Promise((resolve, reject) => {
    var log = new Log();
    (log as any).type = type;
    (log as any).action = action;
    (log as any).message = message;
    (log as any).author = author;
    (log as any).server = server;
    return log.save().then(() => {
      console.log(log);
      return resolve(log);
    }, (err: any) => {
      console.log('Error creating log !: ' + err);
      return reject(err);
    });
  });
}

export function remove(log : any) {
  return new Promise((resolve, reject) => {
    log.remove()
      .then(resolve)
      .catch((err : Error) => {
        console.log('Error deleting log !: ' + err);
        return reject(err);
      });
  });
}
