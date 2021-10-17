import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler
} from 'express'

import { CloudService } from 'cloud/CloudService'
import { ArchiveService } from 'archive/ArchiveService'
import { userAPI } from './users'
import { serverAPI } from './server'
import { uploadAPI } from './upload'

export function api (cloud: CloudService, archive: ArchiveService) {
  const router = Router()
  /* TODO: use ES6 import */
  router.use(userAPI(cloud))
  router.use('/profiles', require('./profiles')) // eslint-disable-line
  router.use('/servers', serverAPI(cloud))
  router.use('/uploads', uploadAPI(cloud, archive))

  return router
}
