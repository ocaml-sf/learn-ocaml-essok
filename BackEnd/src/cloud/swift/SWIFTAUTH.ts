import env from 'src/env'

// Timeout of the next update if the last attempt succeeded/failed (in seconds)
export const timeoutIfSucceeded = 3600
export const timeoutIfFailed = 20

export const authPath = '/v3/auth/tokens'

type Endpoint = {
  // eslint-disable-next-line camelcase
  region_id: string,
  url: string
}
type Service = {
  endpoints: Endpoint[],
  name: string,
  type: string,
}
export type Catalog = Service[]

export const authData = {
  auth: {
    identity: {
      methods: ['password'],
      password: {
        user: {
          name: env.OS_USERNAME,
          domain: { name: env.OS_USER_DOMAIN_NAME },
          password: env.OS_PASSWORD
        }
      }
    },
    scope: {
      project: {
        id: env.OS_TENANT_ID,
        domain: { name: env.OS_PROJECT_DOMAIN_NAME },
        name: env.OS_TENANT_NAME
      }
    }
  }
}

export const tokenHeader = 'x-subject-token'
export const serviceName = 'swift'
export const serviceType = 'object-store'
