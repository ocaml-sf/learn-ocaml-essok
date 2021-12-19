import { Router, Request, Response, NextFunction } from 'express'

export function api () {
  const router = Router()
  /* TODO: use ES6 import */
  router.use(require('./users'))
  router.use('/profiles', require('./profiles'))
  router.use('/servers', require('./server'))
  router.use('/uploads', require('./upload'))

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
