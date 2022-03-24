import axios from 'axios'
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'

import auth from './auth'

import apiCode from '../configs/api_code'
import { CloudService } from 'cloud/CloudService'
import {
  ArchiveService,
  PathFileData,
  convertFileData,
  fileData,
  BufferFileData
} from 'archive/ArchiveService'
import {
  inBufferData,
  inPathData,
  outBufferData,
  outPathData
} from 'utils/Data'

import multer from 'multer'
// eslint-disable-next-line
const mongoose = require('mongoose')

let destPath = ''

const User = mongoose.model('User')
const Server = mongoose.model('Server')

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, 'uploads')
  },
  filename: (req: any, file: any, cb: any) => {
    destPath = `${req.payload.username}${path.extname(file.originalname)}`
    req.archivePath = path.join('uploads', destPath)
    cb(null, destPath)
  }
})
const upload = multer({ storage: storage })

export function uploadAPI (cloud: CloudService, archive: ArchiveService) {
  const router = Router()

  // Preload server objects on routes with ':server'
  router.param('server', async (req, res, next, slug) => {
    const server = await Server.findOne({ slug: slug }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: `Server ${slug} not found` } })
    }
    req.body.server = server
    next()
  })

  router.post('/index', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }

    const server =
      await Server.findOne({ slug: req.body.server }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Server not found' } })
    }
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      console.log(server.author.username)
      console.log(user.username)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const serverPath = path.join('uploads', server.author.username, server.slug)

    const groups =
      await fs.promises.readFile(path.join(serverPath, 'exercises/index.json'),
        { encoding: 'utf8' })
        .then(JSON.parse)
        .then(index => index.groups)
        .catch(err => {
          if (err.code === 'ENOENT') { return [] } else { throw err }
        }) as { [id: string]: { exercises: string[] }}

    const usedList = Object.values(groups).flatMap(group => group.exercises)
    const exercisesList =
      await fs.promises.readdir(path.join(serverPath, 'exercises'))
        .then(files => files.filter(file =>
          !usedList.includes(file) && file !== 'index.json'))
        .catch(err => {
          if (err.code === 'ENOENT') { return [] } else { throw err }
        })
    return res.json({ exercisesList, groups })
  })

  router.post('/check', auth.required, upload.single('file'), async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }
    const server =
      await Server.findOne({ slug: req.body.server }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Server not found' } })
    }
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      console.log(server.author.username)
      console.log(user.username)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!req.file) {
      console.log('No file received')
      return res.send({ success: false })
    }
    console.log('file received')
    const allowedMimetypes = ['zip', 'octet-stream', 'x-zip-compressed']
      .map(typ => 'application/'.concat(typ))
    if (!allowedMimetypes.includes(req.file.mimetype)) {
      console.error(`Bad file Format : ${req.file.mimetype}`)
      console.error('Expected .zip')
      return res.status(apiCode.error)
        .json({
          errors: { file: `must be exercises.zip, found ${req.file.mimetype}` }
        })
    }

    const serverPath = path.join('uploads', server.author.username, server.slug)
    fs.mkdirSync(serverPath, { recursive: true })
    const files =
      (await archive.unzip(inPathData(req.archivePath), outBufferData))
        .filter(file => file.zipPath.startsWith('exercises'))
    fs.unlinkSync(req.archivePath)
    await Promise.all(files.map(async file =>
      convertFileData(file, outPathData(path.join(serverPath, file.zipPath)))))
    console.log(files)

    // Frontend actually need a list of exercises as directories
    const exercisesPath = path.join(serverPath, 'exercises')
    const dirs = fs.readdirSync(exercisesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
    return res.json({ name: dirs })
  })

  router.post('/full', auth.required, upload.single('file'), async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }

    const server =
      await Server.findOne({ slug: req.body.server }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Server not found' } })
    }
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      console.log(server.author.username)
      console.log(user.username)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!req.file) {
      console.log('No file received')
      return res.send({
        success: false
      })
    }

    const allowedMimetypes = ['zip', 'octet-stream', 'x-zip-compressed']
      .map(mime => `application/${mime}`)
    if (!allowedMimetypes.includes(req.file.mimetype)) {
      console.error(`Bad file Format : ${req.file.mimetype}`)
      console.error('\nExpected .zip')
      return res.status(apiCode.error)
        .json({
          errors: { file: 'must be exercises.zip found ' + req.file.mimetype }
        })
    }

    const serverPath = path.join('uploads', server.author.username, server.slug)
    const exercisesPath = path.join(serverPath, 'exercises')
    fs.mkdirSync(exercisesPath, { recursive: true })

    const files = await archive.unzip(inPathData(req.archivePath),
      outBufferData) as BufferFileData[]
    fs.unlinkSync(req.archivePath)

    await Promise.all(files
      .filter(file => file.zipPath.startsWith('repository/exercises'))
      .map(file => {
        const filePath = path.join(exercisesPath, path.basename(file.zipPath))
        fs.mkdirSync(path.dirname(file.zipPath), { recursive: true })
        return fs.promises.writeFile(filePath, file.input)
      }))

    const repoFiles =
      files.filter(file => file.zipPath.startsWith('repository'))
    const repoArchiveData = await archive.zip(repoFiles, outBufferData)
    await cloud.uploadObject(server.slug, 'repository.zip', repoArchiveData)

    const syncFiles = files.filter(file => file.zipPath.startsWith('sync'))
    if (syncFiles.length > 0) {
      const syncArchiveData = await archive.zip(syncFiles, outBufferData)
      await cloud.uploadObject(server.slug, 'sync.zip', syncArchiveData)
    }
    return res.sendStatus(apiCode.ok)
  })

  router.post('/url', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }

    const server = await Server.findOne({ slug: req.body.server }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Server not found' } })
    }
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    const fileUrl = new URL(req.body.url.url)
    fileUrl.pathname = path.join(fileUrl.pathname, '/archive/master.zip')

    const archiveBuffer =
      await axios.get(fileUrl.toString(), { responseType: 'arraybuffer' })
        .then(res => res.data as Buffer)

    const files =
      (await archive.unzip(inBufferData(archiveBuffer), outBufferData))
        .filter(file => file.zipPath.includes('exercises'))
        .map(file => {
          const zipPath = file.zipPath.substring(file.zipPath.indexOf('/') + 1)
          return fileData(file, zipPath)
        })

    const serverPath = path.join('uploads', server.author.username, server.slug)
    await Promise.all(files.map(async file => {
      const filePath = path.join(serverPath, file.zipPath)
      fs.mkdirSync(path.dirname(filePath))
      return fs.promises.writeFile(filePath, file.input)
    }))
    console.log(files)

    // Frontend actually need a list of exercises as directories
    const exercisesPath = path.join(serverPath, 'exercises')
    const dirs = fs.readdirSync(exercisesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
    return res.json({ name: dirs })
  })

  router.post('/send', auth.required, async function (req: any, res: any) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) { return res.sendStatus(apiCode.forbidden) }

    const server =
      await Server.findOne({ slug: req.body.server }).populate('author')
    if (!server) {
      return res.status(apiCode.not_found)
        .json({ errors: { errors: 'Not found' } })
    }
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    await user.startProcessing()
    console.log('user.processing : ' + user.processing)

    const serverPath = path.join('uploads', server.author.username, server.slug)
    const exercisesPath = path.join(serverPath, 'exercises')

    const trash: string[] = req.body.trash
    await Promise.all(trash.map(async exercise =>
      fs.promises.rm(path.join(exercisesPath, exercise), { recursive: true })))

    const indexPath = path.join(exercisesPath, 'index.json')
    const groups =
      req.body.groups as { [id: string]: { title: string, exercises: string[] }}
    const index = { learnocaml_version: '1', groups }
    const indexData = JSON.stringify(index, null, 4)

    if (Object.keys(groups).length === 0) {
      return res.status(400).send({ errors: { file: ': No groups received' } })
    }
    await fs.promises.writeFile(indexPath, indexData, 'utf8')

    const repoDir = 'repository/exercises'
    const safePathData =
      fileData(inPathData(exercisesPath), repoDir) as PathFileData
    const zipData = await archive.zipFromDir(safePathData, outBufferData)
    cloud.uploadObject(server.slug, 'repository.zip', zipData)

    await user.endProcessing()
    console.log(`user.processing : ${user.processing}`)
    return res.send({ success: true, message: 'ok' })
  })

  router.post('/download/:server', auth.required, async function (req: any, res) {
    const user = await User.findById(req.payload.id)
    if (!user) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (!user.isAdmin() && !user.authorized) {
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }
    if (user.processing) {
      return res.sendStatus(apiCode.forbidden)
    }

    const server = req.body.server
    if ((server.author.username !== user.username) && (!user.isAdmin())) {
      console.log(server.author.username)
      console.log(user.username)
      return res.status(apiCode.forbidden)
        .json({ errors: { errors: 'Unauthorized' } })
    }

    await user.startProcessing()
    console.log('user.processing : ' + user.processing)

    const isSaneTarget =
      (['all', 'sync', 'repository'].includes(req.body.target))
    const target = isSaneTarget ? req.body.target : 'all'

    if (target === 'all') {
      const zips = await cloud.downloadAllObjs(server.slug, outBufferData)
      const files =
        await Promise.all(zips.map(zip => archive.unzip(zip, outBufferData)))
          .then(filesLists => filesLists.flat())
      const allZip = await archive.zip(files, outBufferData)

      await user.endProcessing()
      return res.send(allZip.input)
    } else {
      const zip =
        await cloud.downloadObject(server.slug, `${target}.zip`, outBufferData)

      await user.endProcessing()
      return res.send(zip.input)
    }
  })

  return router
}
