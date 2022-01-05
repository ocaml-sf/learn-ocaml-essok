import { Router, Request, Response, NextFunction } from 'express'

import { CloudService } from 'cloud/CloudService'
import { userAPI } from './users'
import { serverAPI } from './server'
import { uploadAPI } from './upload'

export function api (cloud: CloudService) {
  const router = Router()
  /* TODO: use ES6 import */
  router.use(userAPI(cloud))
  router.use('/profiles', require('./profiles')) // eslint-disable-line
  router.use('/servers', serverAPI(cloud))
  router.use('/uploads', uploadAPI(cloud))

  /* TODO: move or remove this error handler */
  function mongooseErrorHandler (err: any, _req: Request,
                                 res: Response, next: NextFunction) {
    if (err.name === 'ValidationError') {
      const errors: {[key: string]: any} = err.errors
      Object.keys(errors).forEach((key: string) => {
        errors[key] = errors[key].message
      })
      return res.status(422).json({ errors })
    }
    return next(err)
  }
  router.use(mongooseErrorHandler)

  return router
}
