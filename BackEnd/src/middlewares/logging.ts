import midMorgan from 'morgan'

import env from 'src/env'

export const morgan = () => midMorgan(env.SERVER_MORGAN_FORMAT)
