import express from 'express'
import { AddressInfo } from 'net'

import env from './env'
import { middlesDev, middlesProd } from './middlewares'
import { api } from './controllers'

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
if (env.isProd) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://172.17.0.2/essok', { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('useCreateIndex', true);
  mongoose.set('debug', true);
}

require('./models/User');
require('./models/Server');
require('./models/Log');
require('./configs/passport');
/* eslint-enable */

app.use('/api', api())

// finally, let's start our server...
const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on port ' + (server.address() as AddressInfo).port)
})
server.setTimeout(30 * 60 * 1000)
