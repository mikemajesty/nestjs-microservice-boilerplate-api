/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/mock.md
 */
import { faker } from '@faker-js/faker'
import { MockOptions, ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { SpanStatus } from '@opentelemetry/api'
import { ApiTracingInput, TracingType, UserRequest } from '../request'

export { MockOptions, ZodMockSchema }

export class MockUtils {
  static faker: typeof faker = faker

  static UUID = () => faker.string.uuid()

  static ObjectId = () => faker.string.hexadecimal({ length: 24, casing: 'lower', prefix: '' })

  static Date = () => faker.date.past()

  static ISODate = () => faker.date.past().toISOString()

  static Text = (length: number = 10) => faker.lorem.words(length)

  static Number = (min: number = 0, max: number = 100) => faker.number.int({ min, max })

  static Boolean = () => faker.datatype.boolean()

  static Array<T>(item: T, length: number = 3): T[] {
    return Array.from({ length }, () => item)
  }

  static Tracing = (): ApiTracingInput => {
    return {
      tracing: {
        logEvent(key: string, value: unknown) {
          return key + value
        },
        setStatus(event: SpanStatus) {
          return event
        },
        addAttribute(key, value) {
          return key + value
        },
        finish() {
          return true
        }
      } as Partial<TracingType> as TracingType,
      user: this.User()
    }
  }

  static User = (): UserRequest => {
    const user: UserRequest = { email: 'test', name: 'test', id: this.UUID() }
    return user
  }
}
