import { Router } from 'express'
import fs from 'fs'
import path from 'path'

import auth from './auth'

// eslint-disable-next-line
import * as server_functions from '../lib/server_functions'
// eslint-disable-next-line
import * as log_functions from '../lib/log_functions'

import apiCode from '../configs/api_code'

// eslint-disable-next-line
import log_message from '../configs/log_message'

import env from 'env'
import { Server, User } from 'models'
import { CloudService } from 'cloud/CloudService'

export function serverAPI (cloud: CloudService) {
  const router = Router()

  // Preload server objects on routes with ':server'
  router.param('server', async function (req: any, res, next, slug) {
    const server = await Server.findOne({ slug: slug }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Server ' + slug + ' not found' } })
    }
    req.server = server
    return next()
  })

  router.get('/', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    debugger
    if (!user) {
      log_functions.create('error', 'get /server/',
        log_message.user_account_unknown + user,
        user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'get /server/',
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    if ((user.username !== req.query.author) && !user.isAdmin()) {
      log_functions.create('error', 'get /server/',
        log_message.user_owner_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const [author] = await user.findAnUser(req.query.author)
    console.log(author)
    const [servers, serversCount] =
      await user.findAllServersOfAnUser(req.query, author, req.payload)
    log_functions.create('general', 'get /server/', 'ok', user, req.server)
    return res.json({
      servers: servers.map((server: any) => server.toJSONFor(author)),
      serversCount: serversCount
    })
  })

  router.post('/', auth.required, async function (req: any, res, _next) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      log_functions.create('error', 'post /server/',
        log_message.user_account_unknown + user, user,
        req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.active) {
      log_functions.create('error', 'post /server/',
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'post /server/',
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const server = new Server(req.body.server)
    server.author = user
    log_functions.create('bin', 'post /server/',
      log_message.user_server_created, user, server)
    await server.save()
    await cloud.createContainer(server.slug)
    await cloud.copyObjects(env.OS_DEFAULT_CONTAINER, server.slug)

    log_functions.create('general', 'post /server/',
      log_message.user_swift_created, user, server)
    console.log('swift created')
    return res.json({ server: server.toJSONFor(user) })
  })

  // return a server
  router.get('/:server', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        log_message.user_account_unknown + user,
        user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const server = req.server.toJSONFor(user)
    if ((user.username !== server.author.username) && (!user.isAdmin())) {
      log_functions.create('error', 'get /server/:' + req.server.slug,
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    log_functions.create('general', 'get /server/:' + req.server.slug, 'ok',
      user, req.server)
    return res.json({ server })
  })

  // update server
  router.put('/:server', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user.active) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        log_message.user_processing_unauthorised,
        user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }
    if (req.server.author._id.toString() !== req.payload.id.toString() &&
      !user.isAdmin()) {
      log_functions.create('error', 'put /server/:' + req.server.slug,
        log_message.user_owner_error, user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }

    if (typeof req.body.server.title !== 'undefined') {
      req.server.title = req.body.server.title
    }
    if (typeof req.body.server.description !== 'undefined') {
      req.server.description = req.body.server.description
    }
    if (typeof req.body.server.body !== 'undefined') {
      req.server.body = req.body.server.body
    }

    const server = req.server.save()
    log_functions.create('bin', 'put /server/:' + req.server.slug,
      'server information updated', user, req.server)
    return res.json({ server: server.toJSONFor(user) })
  })

  // disable or enable a server
  router.post('/disable/:server', auth.required, async function (req: any, res: any) {
    const user = await User.findById(req.payload.id)
    if (req.server.author._id.toString() !== req.payload.id.toString() &&
      user.isAdmin()) {
      log_functions.create('error', 'get /server/disable/:' + req.server.slug,
        log_message.user_owner_error, user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }
    if (!user.active) {
      log_functions.create('error', 'post /server/disable/:' + req.server.slug,
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'post /server/disable/:' + req.server.slug,
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      log_functions.create('error', 'post /server/disable/:' + req.server.slug,
        log_message.user_processing_unauthorised,
        user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }

    const slug = req.server.slug
    const username = req.server.author.username
    const namespace = 'default'

    if (!req.server.active) {
      console.log('shut_on')
      await user.startProcessing()
      console.log('user.processing : ' + user.processing)
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.user_processing_start, user)

      await server_functions.createkubelink(slug, username, namespace)

      await user.endProcessing()
      console.log('user.processing : ' + user.processing)
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.user_processing_end, user)

      req.server.active = true
      await req.server.save()
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.server_shut_on, user, req.server)
      return res.sendStatus(apiCode.ok)
    } else {
      console.log('shut_off')
      await user.startProcessing()
      console.log('user.processing : ' + user.processing)
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.user_processing_start, user)

      server_functions.removekubelink(slug, namespace)

      await user.endProcessing()
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.user_processing_end, user)
      console.log('user.processing : ' + user.processing)

      req.server.active = false
      await req.server.save()
      log_functions.create('bin', 'post /server/disable/:' + req.server.slug,
        log_message.server_shut_off, user, req.server)
      return res.sendStatus(apiCode.ok)
    }
  })

  // delete server
  router.delete('/:server', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        log_message.user_account_unknown + user,
        user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.active) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        log_message.user_processing_unauthorised,
        user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }

    if (req.server.author._id.toString() !== req.payload.id.toString() &&
      user.isAdmin()) {
      log_functions.create('error', 'delete /server/:' + req.server.slug,
        log_message.user_owner_error, user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }

    const slug = req.server.slug
    const namespace = 'default'

    console.log('asking for a deletion')
    console.log('slug : ' + slug)
    log_functions.create('bin', 'delete /server/:' + req.server.slug,
      log_message.user_deletion_ask, user, req.server)

    await user.startProcessing()
    log_functions.create('bin', 'delete /server/:' + req.server.slug,
      log_message.user_processing_start, user)

    await server_functions.removekubelink(slug, namespace)
    console.log('kubelink removed')

    await cloud.deleteObjects(slug)
    await cloud.deleteContainer(slug)
    console.log('swift container removed')

    const serverDir = path.join('./uploads', user.username, slug)
    await fs.promises.rm(serverDir, { recursive: true })
    console.log('server deleted')

    await user.endProcessing()
    log_functions.create('bin', 'delete /server/:' + req.server.slug,
      log_message.user_processing_end, user)
    log_functions.create('bin', 'delete /server/:' + req.server.slug,
      log_message.server_deletion_ok, user, req.server)
    await req.server.remove()
    return res.sendStatus(apiCode.ok)
  })

  router.post('/token/:server', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        log_message.user_account_unknown + user,
        user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.active) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        log_message.user_account_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      log_functions.create('error', 'post /server/:' + req.server.slug,
        log_message.user_activated_error, user, req.server)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (req.server.author._id.toString() !== req.payload.id.toString() &&
        user.isAdmin()) {
      log_functions.create('error', 'get /server/disable/:' + req.server.slug,
        log_message.user_owner_error, user, req.server)
      return res.sendStatus(apiCode.forbidden)
    }

    if (req.server.token !== undefined) {
      console.log(req.server.token)
      return res.status(apiCode.error)
        .send({ errors: 'teacher token already retrieve' })
    }

    const slug = req.server.slug
    const namespace = 'default'
    await user.startProcessing()

    const token = server_functions.catchTeacherToken(slug, namespace)
    log_functions.create('bin', 'post /server/token:' + req.server.slug,
      log_message.user_token_ok, user, req.server)
    req.server.token = token

    await req.server.save()
    await user.endProcessing()
    return res.json({ server: req.server.toJSONFor(user) })
  })

  return router
}
