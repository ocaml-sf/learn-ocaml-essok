import { bool, host, port, str } from 'envalid'
import { ownDefault } from './utils'

export default {
  SERVER_HOSTNAME: host({ devDefault: 'localhost' }),
  SERVER_PORT: port({ devDefault: 3000 }),

  SERVER_DEBUG: bool({
    desc: 'Allow to see more debug from like error handlers',
    default: false,
    devDefault: ownDefault({ dev: true, test: false, all: false })
  }),
  SERVER_MORGAN_FORMAT: str({
    choices: ['combined', 'common', 'dev', 'short', 'tiny'],
    default: 'combined',
    devDefault: 'dev',
    docs: 'https://www.npmjs.com/package/morgan#predefined-formats'
  })
}
