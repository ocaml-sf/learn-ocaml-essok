import express from 'express'
import { AddressInfo } from 'net'

import env from './env'
import { errorsDev, errorsProd, middlesDev, middlesProd } from './middlewares'
import { api } from './controllers'
import { SwiftService } from './cloud/SwiftService'
import { AdmZipService } from './archive/AdmZipService'

const mongoose = require('mongoose')

const app = express()

let middlewares: Function[] = []
if (env.isDev) {
  middlewares = Object.values(middlesDev)
} else if (env.isProd) {
  middlewares = Object.values(middlesProd)
}
middlewares.forEach(m => app.use(m()))

/* eslint-disable */
mongoose.connect(`mongodb://${env.DB_HOSTNAME}/essok`);
mongoose.set('debug', env.DB_DEBUG)

require('./models/User');
require('./models/Server');
require('./models/Log');
require('./configs/passport');
/* eslint-enable */

const cloud = new SwiftService()
cloud.init()

app.use('/api', api(cloud, new AdmZipService()))

let errhandlers: Function[] = []
if (env.isDev) {
  errhandlers = Object.values(errorsDev)
} else if (env.isProd) {
  errhandlers = Object.values(errorsProd)
}
errhandlers.forEach(eh => app.use(eh()))


// finally, let's start our server...
const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on port ' + (server.address() as AddressInfo).port)
})
server.setTimeout(30 * 60 * 1000)
