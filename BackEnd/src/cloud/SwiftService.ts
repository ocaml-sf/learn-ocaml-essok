import axios from 'axios'
import { promises as fs } from 'fs'

import env from 'src/env'
import {
  CloudService,
  ContainerName,
  ObjectName,
  ObjectData
} from './CloudService'
import * as auth from './swift/SWIFTAUTH'
import * as container from './swift/SWIFTCONTAINER'
import { SwiftError, SwiftErrorType } from './swift/SwiftError'

type Token = string
type UrlService = string
export class SwiftService implements CloudService {
  token!: Token
  cloudUrl!: UrlService
  updateSuccess!: boolean
  readonly updateOnce!: boolean

  constructor ({ updateOnce } = { updateOnce: false }) {
    this.updateSuccess = false
    this.updateOnce = updateOnce
  }

  async init (): Promise<void> {
    return this.updateCredentials()
  }

  async updateCredentials (): Promise<void> {
    return this.requestAuth()
      .then(({ token, catalog }: { token: Token, catalog: auth.Catalog }) => {
        this.token = token
        this.cloudUrl = this.findUrlService(catalog)
        this.updateSuccess = true
      }).catch((err: Error) => {
        console.error(err)
        this.updateSuccess = false
      }).then(() => {
        if (!this.updateOnce) {
          let timeout: number
          if (this.updateSuccess) {
            timeout = auth.timeoutIfSucceeded
            console.log('Cloud update credentials: success')
          } else {
            timeout = auth.timeoutIfFailed
            console.error('Cloud update credentials: fail')
          }
          console.log(`next update credentials in ${timeout} seconds`)
          setTimeout(this.updateCredentials.bind(this), timeout * 1000)
        }
      })
  }

  async requestAuth (): Promise<{ token: string, catalog: auth.Catalog }> {
    return axios({
      method: 'post',
      baseURL: env.OS_AUTH_URL,
      url: auth.authPath,
      data: auth.authData
    }).then(res => {
      return {
        token: res.headers[auth.tokenHeader],
        catalog: res.data.token.catalog
      }
    })
  }

  findUrlService (catalog: auth.Catalog): UrlService {
    const cloudService = catalog.find(service =>
      service.name === auth.serviceName && service.type === auth.serviceType)
    if (cloudService === undefined) {
      throw new SwiftError(SwiftErrorType.ServiceNotFound)
    } else {
      const endpointService = cloudService.endpoints.find(endpoint =>
        endpoint.region_id === env.OS_REGION_NAME)
      if (endpointService === undefined) {
        throw new SwiftError(SwiftErrorType.RegionNotFound)
      } else {
        return endpointService.url
      }
    }
  }

  checkServiceAvailability (): void {
    if (!this.updateSuccess) {
      throw new SwiftError(SwiftErrorType.ServiceIsUnavailable)
    }
  }

  async listContainers (): Promise<ContainerName[]> {
    this.checkServiceAvailability()
    return axios({
      method: 'get',
      baseURL: this.cloudUrl,
      url: '/',
      headers: { 'X-Auth-Token': this.token }
    }).then(res => res.data.map((con: container.Container) => con.name))
  }

  async createContainer (name: ContainerName): Promise<void> {
    this.checkServiceAvailability()
    await axios({
      method: 'put',
      baseURL: this.cloudUrl,
      url: `/${name}`,
      headers: { 'X-Auth-Token': this.token }
    })
  }

  async deleteContainer (name: ContainerName): Promise<void> {
    this.checkServiceAvailability()
    await axios({
      method: 'delete',
      baseURL: this.cloudUrl,
      url: `/${name}`,
      headers: { 'X-Auth-Token': this.token }
    })
  }

  async listObjects (name: ContainerName): Promise<ObjectName[]> {
    this.checkServiceAvailability()
    return axios({
      method: 'get',
      baseURL: this.cloudUrl,
      url: `/${name}`,
      headers: { 'X-Auth-Token': this.token }
    }).then(res => res.data.map((obj: container.Object) => obj.name))
  }

  async getObject (cName: ContainerName,
                   oName: ObjectName): Promise<ObjectData> {
    this.checkServiceAvailability()
    return axios({
      method: 'get',
      baseURL: this.cloudUrl,
      url: `/${cName}/${oName}`,
      headers: { 'X-Auth-Token': this.token }
    }).then(res => res.data)
  }

  async createObject (cName: ContainerName,
                      oName: ObjectName, oData: ObjectData): Promise<void> {
    this.checkServiceAvailability()
    await axios({
      method: 'put',
      baseURL: this.cloudUrl,
      url: `/${cName}/${oName}`,
      headers: { 'X-Auth-Token': this.token },
      data: oData
    })
  }

  async deleteObject (cName: ContainerName, oName: ObjectName): Promise<void> {
    this.checkServiceAvailability()
    await axios({
      method: 'delete',
      baseURL: this.cloudUrl,
      url: `/${cName}/${oName}`,
      headers: { 'X-Auth-Token': this.token }
    })
  }
}
