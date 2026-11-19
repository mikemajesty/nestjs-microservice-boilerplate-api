/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/session.md
 */
import {
  SessionIsActiveInput,
  SessionIsActiveOutput,
  SessionRevokeAllOutput,
  SessionRevokeInput,
  SessionRevokeOutput,
  SessionRotateInput,
  SessionRotateOutput,
  SessionStartOutput,
  SessionUser
} from './service'

export abstract class ISessionAdapter {
  abstract start(user: SessionUser): Promise<SessionStartOutput>
  abstract rotate(input: SessionRotateInput): Promise<SessionRotateOutput>
  abstract isActive(input: SessionIsActiveInput): Promise<SessionIsActiveOutput>
  abstract revoke(input: SessionRevokeInput): Promise<SessionRevokeOutput>
  abstract revokeAll(userId: string): Promise<SessionRevokeAllOutput>
}
