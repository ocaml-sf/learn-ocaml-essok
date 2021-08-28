export const tokenHeaderKey = 'X-Auth-Token'

// OVH baseURL adds /v1/{account} by default
export const listContainersPath = '/'

export type Container = {
  count: number,
  byte: number,
  name: string
}

export type Object = {
  bytes: number,
  // eslint-disable-next-line camelcase
  last_modified: string,
  hash: string,
  name: string,
  // eslint-disable-next-line camelcase
  content_type: string
}
