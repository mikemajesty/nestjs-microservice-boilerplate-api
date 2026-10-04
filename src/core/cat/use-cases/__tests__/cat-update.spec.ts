/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { UpdatedModel } from '@/infra/repository'
import { ICatUpdate } from '@/modules/cat/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { CatEntity, CatEntitySchema } from '../../entity/cat'
import { ICatRepository } from '../../repository/cat'
import { CatUpdateInput, CatUpdateUsecase } from '../cat-update'

describe(CatUpdateUsecase.name, () => {
  let usecase: ICatUpdate
  let repository: ICatRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        TestUtils.mockProvider(ICatRepository),
        {
          provide: ICatUpdate,
          useFactory: (catRepository: ICatRepository, logger: ILoggerAdapter) => {
            return new CatUpdateUsecase(catRepository, logger)
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ICatUpdate)
    repository = app.get(ICatRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatUpdateInput, MockUtils.Tracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<CatUpdateInput>('id')
          }
        ])
      }
    )
  })

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null)

    await expect(usecase.execute({ id: MockUtils.UUID() }, MockUtils.Tracing())).rejects.toThrow(ApiNotFoundException)
  })

  const mock = new ZodMockSchema(CatEntitySchema)
  const input = mock.generate<CatEntity>({
    overrides: {
      updatedAt: null,
      createdAt: null,
      deletedAt: null
    }
  })

  test('when cat updated successfully, should expect a cat updated', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(input)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>()

    await expect(usecase.execute({ id: MockUtils.UUID() }, MockUtils.Tracing())).resolves.toEqual(input)
  })
})
