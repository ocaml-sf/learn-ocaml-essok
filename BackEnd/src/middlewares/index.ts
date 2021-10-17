import { cors, json, urlencoded } from './core'
import { devError, prodError } from './errorhandlers'
import { morgan } from './logging'
import { helmet } from './security'

const middlesAll = {
  cors,
  json,
  morgan,
  urlencoded
}

export const middlesDev = {
  ...middlesAll
}

export const middlesProd = {
  ...middlesAll,
  helmet
}

export const errorsDev = {
  devError
}

export const errorsProd = {
  prodError
}
