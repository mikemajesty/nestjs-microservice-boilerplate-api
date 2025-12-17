/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/event.md
 */
import { EmitEventOutput } from './service'
import { EventNameEnum } from './types'

export abstract class IEventAdapter {
  abstract emit<T>(event: EventNameEnum, payload: T): EmitEventOutput
}
