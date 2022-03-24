import { Router } from 'express'
import fs from 'fs'
import path from 'path'

import auth from './auth'

// eslint-disable-next-line
import * as server_functions from '../lib/server_functions'

import apiCode from '../configs/api_code'

import { CloudService } from 'cloud/CloudService'
import { User } from 'models'
import passport from 'passport'

// can delegate cloud API call to serverAPI ?
export function userAPI (cloud: CloudService) {
  const router = Router()

  router.get('/user', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    return res.json({ user: user.toAuthJSON() })
  })

  router.get('/users', auth.required, async function (req: any, res, next) {
    const query: any = {}
    let limit = 20
    let offset = 0
    console.log(' req.query.limit ' + req.query.limit)
    console.log(' req.query.offset ' + req.query.offset)
    console.log(' req.query.active ' + req.query.active)
    console.log(' req.query.authorized ' + req.query.authorized)

    if (typeof req.query.limit !== 'undefined') {
      limit = req.query.limit
    }
    if (typeof req.query.offset !== 'undefined') {
      offset = req.query.offset
    }
    if (typeof req.query.active !== 'undefined') {
      query.active = req.query.active
    }
    if (typeof req.query.authorized !== 'undefined') {
      query.authorized = req.query.authorized
    }

    const user = await User.findById(req.payload.id)
    if (!user || !user.isAdmin()) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.isAdmin()) {
      const [users, usersCount] = await user.findAllUsers(query, limit, offset)
      return res.json({ users: users, usersCount: usersCount })
    }
  })

  router.put('/user', auth.required, async function (req: any, res, next) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.active) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const userToModify =
      (user.isAdmin() && (req.body.userBase.username !== 'undefined'))
        ? (await User.find({ username: req.body.userBase.username }))[0]
        : user

    if (userToModify !== 'undefined') {
      // only update fields that were actually passed...
      // if (typeof req.body.user.username !== 'undefined') { // may be useless
      //   userToMdify.username = req.body.user.username;
      // }
      if ((typeof req.body.user.email !== 'undefined')) {
        userToModify.email = req.body.user.email
      }
      if (typeof req.body.user.description !== 'undefined') {
        userToModify.description = req.body.user.description
      }
      if (typeof req.body.user.place !== 'undefined') {
        userToModify.place = req.body.user.place
      }
      if (typeof req.body.user.goal !== 'undefined') {
        userToModify.goal = req.body.user.goal
      }
      if (typeof req.body.user.image !== 'undefined') {
        userToModify.image = req.body.user.image
      }
      await userToModify.save()
      return res.json({ user: userToModify.toAuthJSON() })
    }
  })

  router.post('/users/login', async function (req: any, res, next) {
    if (!req.body.user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: "can't be blank" } })
    }
    if (!req.body.user.password) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    // TODO: use simple way to check password (with hash)
    function cb (err: any, user: any, info: any) {
      if (err) { return next(err) }
      if (user) {
        user.token = user.generateJWT()
        return res.json({ user: user.toAuthJSON() })
      } else {
        return res.status(apiCode.error).json(info)
      }
    }
    passport.authenticate('local', { session: false }, cb)(req, res, next)
  })

  router.post('/reset-password', auth.required, async function (req: any, res) {
    if (!req.body.reset.new_password) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.active) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!req.body.user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: "can't be blank" } })
    }

    if (req.body.user.email !== user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: 'does not correspond' } })
    }
    if (!req.body.user.password) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(apiCode.error)
        .json({ errors: { password: 'does not correspond' } })
    }

    user.setPassword(req.body.reset.new_password)

    await user.save()
    return res.json({ user: user.toAuthJSON() })
  })

  // disable or enable an user
  router.post('/users/disable', auth.required, async function (req: any, res, next) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.authorized && !user.isAdmin()) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.status(apiCode.forbidden)
    }

    if (!req.body.user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: "can't be blank" } })
    }

    if (req.body.user.email !== user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: 'does not correspond' } })
    }

    if (!req.body.user.password) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(apiCode.error)
        .json({ errors: { password: 'does not correspond' } })
    }

    if (!req.body.disable.password_verification) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    if (req.body.user.password !== req.body.disable.password_verification) {
      return res.status(apiCode.error)
        .json({ errors: { password: 'verification mismatch' } })
    }
    if (!req.body.disable.username_verification) {
      return res.status(apiCode.error)
        .json({ errors: { username: "can't be blank" } })
    }

    if (!user.isAdmin()) {
      if (req.body.disable.username_verification !== user.username) {
        return res.status(apiCode.error)
          .json({ errors: { username: 'verification mismatch' } })
      }
    }

    const [author] =
      await user.findAnUser(req.body.disable.username_verification)

    const [servers] =
      await user.findAllServersOfAnUser(req.query, author, req.payload)

    await Promise.all(servers.map(async (server: any) => {
      if (server.active && user.active) {
        console.log('preparing shut_off')
        const namespace = 'default'
        await server_functions.removekubelink(server.slug, namespace)
        server.active = false
        return server.save()
      }
    }))

    console.log('author = ' + author)
    console.log('all servers are done')
    author.active = !author.active
    console.log('user status up to date')
    await author.save()

    if (!user.isAdmin()) {
      return res.json({ user: author.toAuthJSON() })
    } else {
      return res.json({ user: user.toAuthJSON() })
    }
  })

  // delete an user
  router.post('/users/delete', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.sendStatus(apiCode.forbidden)
    }
    if (!user.authorized && !user.isAdmin()) {
      return res.sendStatus(apiCode.forbidden)
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }

    if (!req.body.user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: "can't be blank" } })
    }

    if (req.body.user.email !== user.email) {
      return res.status(apiCode.error)
        .json({ errors: { email: 'does not correspond' } })
    }

    if (!req.body.user.password) {
      return res.status(apiCode.error)
        .json({ errors: { password: "can't be blank" } })
    }

    if (!user.validPassword(req.body.user.password)) {
      return res.status(apiCode.error)
        .json({ errors: { password: 'does not correspond' } })
    }
    if (!req.body.disable.username_verification) {
      return res.status(apiCode.error)
        .json({ errors: { username: "can't be blank" } })
    }
    if (!user.isAdmin() &&
      req.body.disable.username_verification !== user.username) {
      return res.status(apiCode.error)
        .json({ errors: { username: 'verification mismatch' } })
    }

    const [author] =
      await user.findAnUser(req.body.disable.username_verification)
    console.log('author = ' + author)

    const [servers] =
      await user.findAllServersOfAnUser(req.query, author, req.payload)
    const namespace = 'default'

    await Promise.all(servers.map(async (server: any) => {
      console.log(`asking for a deletion: ${server.slug}`)
      await server_functions.removekubelink(server.slug, namespace)
      console.log('kubelink removed')

      await cloud.deleteObjects(server.slug)
      console.log('swift container removed')

      const serverDir = path.join('./uploads', user.username, server.slug)
      await fs.promises.rm(serverDir, { recursive: true })
      console.log('server deleted from uploads')

      return server.remove()
    }))

    console.log('all servers are done')
    await author.remove()
    return res.sendStatus(apiCode.ok)
  })

  router.post('/users', async function (req: any, res) {
    const user = new User()

    user.username = req.body.user.username
    user.email = req.body.user.email
    user.description = req.body.user.description
    user.place = req.body.user.place
    user.goal = req.body.user.goal
    user.setPassword(req.body.user.password)

    await user.save()
    return res.json({ user: user.toAuthJSON() })
  })

  router.post('/user/activate', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.sendStatus(apiCode.forbidden)
    }
    if (!user.isAdmin()) {
      return res.sendStatus(apiCode.forbidden)
    }

    const [userToActivate] = await user.findAnUser(req.body.user.username)
    userToActivate.authorized = true
    userToActivate.active = true
    await userToActivate.save()
    return res.json({ user: userToActivate.toAuthJSON() })
  })

  router.post('/user/authorize', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.sendStatus(apiCode.forbidden)
    }
    if (!user.isAdmin()) {
      return res.sendStatus(apiCode.forbidden)
    }

    const [userToAuthorize] = await user.findAnUser(req.body.user.username)
    userToAuthorize.authorized = true
    userToAuthorize.processing = false

    await userToAuthorize.save()
    return res.json({ user: userToAuthorize.toAuthJSON() })
  })

  return router
}
