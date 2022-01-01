export enum SwiftErrorType {
  ServiceNotFound,
  RegionNotFound,
  ServiceIsUnavailable,
}

export class SwiftError extends Error {
  constructor (errorType: SwiftErrorType) {
    switch (errorType) {
    case SwiftErrorType.ServiceNotFound:
      super('cloud service is not listed in the catalog')
      this.name = 'ServiceNotFoundError'
      break
    case SwiftErrorType.RegionNotFound:
      super('region of the cloud service is not listed in the catalog')
      this.name = 'RegionNotFoundError'
      break
    case SwiftErrorType.ServiceIsUnavailable:
      super('cloud service is unavailable until next update attempt')
      this.name = 'ServiceIsUnavailableError'
    }
  }
}
