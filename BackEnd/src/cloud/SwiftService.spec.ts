import { strict as assert } from 'assert'

import { DataKind, InputData, OutputData } from 'utils/Data'
import { SwiftService } from './SwiftService'

describe('SwiftService', function () {
  this.slow(2000)
  this.timeout(3000)

  describe('Auth', function () {
    describe('requestAuth()', function () {
      it('should return a token and catalog', async function () {
        const service = new SwiftService({ updateOnce: true })
        const { token, catalog } = await service.requestAuth()
          .catch(err => { console.error(err); throw err })
        assert.ok(token)
        assert.ok(catalog)
      })
    })

    describe('init()', function () {
      it('should set token and cloudUrl', async function () {
        const service = new SwiftService({ updateOnce: true })
        await service.init()
        assert.ok(service.token)
        assert.ok(service.cloudUrl)
      })
    })
  })

  describe('Cloud services', function () {
    const service = new SwiftService({ updateOnce: true })
    before(async function () {
      await service.init()
    })

    describe('Container', function () {
      const lsName = 'list'
      const crName = 'creation'
      const dlName = 'deletion'

      describe('listContainers()', function () {
        it('should return list of containers', async function () {
          const containers = await service.listContainers()
          assert(containers.includes(lsName))
        })
      })

      /**
       * Documentation from Openstack:
       * You do not need to check whether a container already exists before
       * issuing a PUT operation because the operation is idempotent: It creates
       * a container or updates an existing container, as appropriate.
       */
      describe(`createContainer(${crName})`, function () {
        it(`should create a container named '${crName}'`, async function () {
          await service.createContainer(crName)
          const containers = await service.listContainers()
          assert(containers.includes(crName))
        })
      })

      describe(`deleteContainer(${dlName})`, function () {
        beforeEach(async function () {
          await service.createContainer(dlName)
        })

        it(`should delete a container named ${dlName}`, async function () {
          await service.deleteContainer(dlName)
          const containers = await service.listContainers()
          assert(!containers.includes(dlName))
        })
      })
    })

    describe('Objects from container', function () {
      const cName = 'objects'
      const lsOName = 'listObj'
      const dlOName = 'dlObj'
      const dlOData = 'data'
      const crOName = 'creationObj'
      const crOData = 'cData'
      const delOName = 'deletionObj'

      const options: OutputData = { kind: DataKind.Buffer }

      describe(`listObjects(${cName})`, function () {
        it('should return the list of objects', async function () {
          const objects = await service.listObjects(cName)
          assert(objects.includes(lsOName))
        })
      })

      describe(`downloadObject(${cName}, ${dlOName})`, function () {
        it(`should return the data of object ${dlOName}`, async function () {
          const buffer = await service.downloadObject(cName, dlOName, options)
          assert.equal(buffer.input.toString(), dlOData)
        })
      })

      describe(`uploadObject(${cName}, ${crOName})`, function () {
        it(`should create object named ${crOName}`, async function () {
          const oData: InputData = {
            kind: DataKind.Buffer,
            input: Buffer.from(crOData)
          }
          await service.uploadObject(cName, crOName, oData)
          const data = await service.downloadObject(cName, crOName, options)
          assert.equal(data.input.toString(), crOData)
        })
      })

      describe(`deleteObject(${cName}, ${delOName})`, function () {
        beforeEach(async function () {
          const oData: InputData = {
            kind: DataKind.Buffer,
            input: Buffer.from('')
          }
          await service.uploadObject(cName, delOName, oData)
        })

        it(`should delete object named ${delOName}`, async function () {
          await service.deleteObject(cName, delOName)
          const objects = await service.listObjects(cName)
          assert(!objects.includes(delOName))
        })
      })
    })
  })
})
