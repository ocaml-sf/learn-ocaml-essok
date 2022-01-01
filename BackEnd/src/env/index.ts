import { cleanEnv, str } from 'envalid'

import serverEnv from './server'
import dbEnv from './db'
import cloudEnv from './cloud'

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production']
  }),

  ...serverEnv,
  ...dbEnv,
  ...cloudEnv
})

export default env
