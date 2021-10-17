import { Router } from 'express'

import auth from './auth'

import apiCode from '../configs/api_code'

// eslint-disable-next-line
const mongoose = require('mongoose')
const User = mongoose.model('User')

const router = Router()

// Preload user profile on routes with ':username'
router.param('username', async function (req: any, res, next, username) {
  const user = await User.findOne({ username: username })
  if (!user) {
    return res.sendStatus(apiCode.not_found)
      .json({ errors: { errors: 'User not found' } })
  }
  req.profile = user
  return next()
})

router.get('/:username', auth.required, async function (req: any, res) {
  const user = await User.findById(req.payload.id)
  if (!user || (!user.isAdmin() && !user.authorized) ||
    ((user.username !== req.profile.username) && (!user.isAdmin()))) {
    return res.sendStatus(apiCode.forbidden)
  }
  return res.json({ profile: req.profile.toProfileJSONFor(user) })
})

// code duplication to remove in the future
router.get('/user/:username', auth.required, async function (req: any, res) {
  const user = await User.findById(req.payload.id)
  if (!user || (!user.isAdmin() && !user.authorized) ||
    ((user.username !== req.profile.username) && (!user.isAdmin()))) {
    return res.sendStatus(apiCode.forbidden)
  }
  return res.json({ user: req.profile.toAuthJSON() })
})

module.exports = router
