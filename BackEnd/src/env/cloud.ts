import { str, url } from 'envalid'

export default {
  OS_AUTH_URL: url(),

  OS_USER_DOMAIN_NAME: str({ default: 'Default' }),
  OS_PROJECT_DOMAIN_NAME: str({ default: 'Default' }),

  OS_TENANT_ID: str(),
  OS_TENANT_NAME: str(),

  OS_USERNAME: str(),
  OS_PASSWORD: str(),
  OS_REGION_NAME: str()
}
