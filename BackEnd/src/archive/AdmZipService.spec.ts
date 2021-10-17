import { strict as assert } from 'assert'
import path from 'path'

import { ArchiveService, fileData, PathFileData } from './ArchiveService'
import { AdmZipService } from './AdmZipService'
import { DataKind, inPathData, outBufferData } from 'utils/Data'

const assets = './assets'

describe('AdmZipService', function () {
  const service: ArchiveService = new AdmZipService()
  const archivePath = path.join(assets, 'archive.zip')
  const archiveDir = 'archiveDir/'
  const archiveFile = path.join(archiveDir, 'archiveFile')
  const archiveData = 'archiveData'

  describe(`unzip(${archivePath})`, function () {
    it('should unzip archive', async function () {
      const files = await service.unzip(inPathData(archivePath), outBufferData)
      assert.equal(files.length, 1)

      const file = files[0]
      assert.equal(file.kind, DataKind.Buffer)
      assert.equal(file.zipPath, archiveFile)
      assert.equal(file.input.toString(), archiveData)
    })
  })

  describe(`zip(${archiveFile})`, function () {
    it('should zip archive file', async function () {
      const archiveFilePath = path.join(assets, archiveFile)
      const archiveFileData =
        fileData(inPathData(archiveFilePath), archiveFile) as PathFileData
      const archive = await service.zip([archiveFileData], outBufferData)

      const files = await service.unzip(archive, outBufferData)
      assert.equal(files.length, 1)

      const file = files[0]
      assert.equal(file.kind, DataKind.Buffer)
      assert.equal(file.zipPath, archiveFile)
      assert.equal(file.input.toString(), archiveData)
    })
  })

  describe(`zipFromDir(${archiveDir})`, function () {
    it('should zip from directory', async function () {
      const archiveDirPath = path.join(assets, archiveDir)
      const archiveFileData =
        fileData(inPathData(archiveDirPath), archiveDir) as PathFileData
      const archive = await service.zipFromDir(archiveFileData, outBufferData)

      const files = await service.unzip(archive, outBufferData)

      const file = files[0]
      assert.equal(file.kind, DataKind.Buffer)
      assert.equal(file.zipPath, archiveFile)
      assert.equal(file.input.toString(), archiveData)
    })
  })
})
