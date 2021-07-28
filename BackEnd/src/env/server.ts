import { bool, host, port, url, str } from 'envalid'
import { ownDefault } from './utils'

export default {
  SERVER_HOSTNAME: host({ devDefault: 'localhost' }),
  SERVER_PORT: port({ devDefault: 3000 }),

  SERVER_CORS_ORIGIN: url({
    desc: 'FrontEnd url to allow cross-origin request',
    devDefault: 'http://localhost:4200'
  }),
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
