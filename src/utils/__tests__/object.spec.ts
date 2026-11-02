/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/object.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */

import { ISecretsAdapter } from '@/infra/secrets/adapter'

import { ObjectUtils } from '../object'

describe(ObjectUtils.name, () => {
  it('should return an instance property name from an abstract class token', () => {
    expect(ObjectUtils.nameOf<ISecretsAdapter>('HTTP_REQUEST_TIMEOUT_MS')).toBe('HTTP_REQUEST_TIMEOUT_MS')
  })

  it('should return a static property name from a class token', () => {
    class Example {
      static readonly PROPERTY = 'value'
    }

    const propertyName = ObjectUtils.nameOf<typeof Example>('PROPERTY')

    expect(Example[propertyName]).toBe('value')
  })
})
