import midCors from 'cors'
import { urlencoded as midUrlEncoded } from 'express'

import env from 'env'

export const cors = () => midCors({
  origin: env.SERVER_CORS_ORIGIN
// Are these useful ?
//  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
//  credentials: true
})

export { json } from 'express'

export const urlencoded = () => midUrlEncoded({ extended: false })
