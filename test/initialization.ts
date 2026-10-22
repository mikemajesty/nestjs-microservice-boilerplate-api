import { EnvEnum } from '@/infra/secrets/types'
import { execSync } from 'child_process'

jest.setTimeout(60000)

process.env.NODE_ENV = EnvEnum.TEST
process.env.LOG_LEVEL = `silent`
process.env.JWT_SECRET = 'test-secret'
process.env.TOKEN_EXPIRATION = String(300)
process.env.JWT_REFRESH_SECRET_KEY = 'test-refresh-secret'
process.env.NODE_OPTIONS = '--experimental-vm-modules'
process.env.HTTP_REQUEST_TIMEOUT_MS = String(5000)

try {
  execSync('docker info', { stdio: 'ignore' })
} catch {
  console.error(`
    Error: Docker is not running or accessible.

    Container tests require Docker to be active.
    Please start Docker and run the tests again.
  `)
  process.exit(1)
}
