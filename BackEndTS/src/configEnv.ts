import { cleanEnv, bool, host, port, str } from "envalid";

// Env variable setup
const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production"],
  }),

  SERVER_HOSTNAME: host({ devDefault: "localhost" }),
  SERVER_PORT: port({ devDefault: 3000 }),

  SERVER_MORGAN_FORMAT: str({
    choices: ["combined", "common", "dev", "short", "tiny"],
    default: "combined",
    devDefault: "dev",
    docs: "https://www.npmjs.com/package/morgan#predefined-formats",
  }),

  SERVER_SESSION_NAME: str({ devDefault: "session" }),
  SERVER_SESSION_SECRET: str({ devDefault: "essok" }),

  DB_HOSTNAME: host({ devDefault: "blabla" }),
  DB_PORT: port({ devDefault: 27017 }),
  DB_NAME: str({
    desc: "The name of your database",
    devDefault: "dbDev"
  }),
  DB_DEBUG: bool({
    default: false,
    devDefault: true,
  }),
})

export default env;
