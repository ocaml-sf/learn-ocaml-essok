import { cors, json, urlencoded } from './core'
import { devError } from './errorhandlers'
import { morgan } from './logging'
import { helmet } from './security'
import { session } from './session'

const middlesAll = {
  json,
  morgan,
  session,
  urlencoded
}

export const middlesDev = {
  ...middlesAll,
  devError
}

export const middlesProd = {
  ...middlesAll,
  cors,
  helmet
}
