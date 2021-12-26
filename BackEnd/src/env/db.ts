import { bool, host } from 'envalid'

export default {
  DB_HOSTNAME: host({ devDefault: 'localhost' }),

  DB_DEBUG: bool({ devDefault: true, default: false })
}
