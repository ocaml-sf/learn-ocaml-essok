import { cleanEnv, bool, host, port, str } from "envalid";

/*
   eslint-disable
   @typescript-eslint/no-explicit-any,
   @typescript-eslint/no-unsafe-return
*/
// Utility function for default values
function ownDefault({ dev, test, all } :
                    { dev : any, test : any, all : any }) {
  switch(process.env.NODE_ENV) {
    case "test" :
      return test;
    case "development" :
      return dev;
    default :
      return all;
  }
}
/*
  eslint-enable
   @typescript-eslint/no-explicit-any,
   @typescript-eslint/no-unsafe-return
*/

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Env variable setup
const env = cleanEnv(process.env, {
  NODE_ENV : str({
    choices : ["development", "test", "production"],
  }),

  SERVER_HOSTNAME : host({ devDefault : "localhost" }),
  SERVER_PORT : port({ devDefault : 3000 }),

  SERVER_DEBUG : bool({
    default : false,
    devDefault : ownDefault({ dev : true, test : false, all : false}),
  }),
  SERVER_MORGAN_FORMAT : str({
    choices : ["combined", "common", "dev", "short", "tiny"],
    default : "combined",
    devDefault : "dev",
    docs : "https://www.npmjs.com/package/morgan#predefined-formats",
  }),

  SERVER_SESSION_NAME : str({ devDefault : "session" }),
  SERVER_SESSION_SECRET : str({ devDefault : "essok" }),

  DB_HOSTNAME : host({ devDefault : "localhost" }),
  DB_PORT : port({ devDefault : 27017 }),
  DB_NAME : str({
    desc : "The name of your database",
    devDefault : ownDefault({ dev : "dbDev", test : "dbTest", all : "dbAll" }),
  }),
  DB_DEBUG : bool({
    default : false,
    devDefault : ownDefault({ dev : true, test : false, all : true }),
  }),
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */


export default env;
