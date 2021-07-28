import midCors from 'cors'
import { urlencoded as midUrlEncoded } from 'express'

import env from 'src/env'

export const cors = () => midCors({
  origin: `https://${env.SERVER_HOSTNAME}:${env.SERVER_PORT}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true
})

export { json } from 'express'

export const urlencoded = () => midUrlEncoded({ extended: false })
