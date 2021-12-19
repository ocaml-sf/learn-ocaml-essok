import { Request, Response, NextFunction } from 'express'

export const devError = () =>
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err?.stack)

    res?.status(err?.status || 500)
    res?.json({
      errors: {
        message: err.message,
        error: err
      }
    })
  }

export const prodError = () =>
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500)
    res.json({
      errors: {
        message: err.message,
        error: {}
      }
    })
  }
