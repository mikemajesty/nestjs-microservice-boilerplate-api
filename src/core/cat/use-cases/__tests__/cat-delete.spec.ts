/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { CatDeleteInput, CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { ICatDelete } from '@/modules/cat/interfaces'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { CatEntity, CatEntitySchema } from '../../entity/cat'
import { ICatRepository } from '../../repository/cat'

describe(CatDeleteUsecase.name, () => {
  let usecase: ICatDelete
  let repository: ICatRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {}
        },
        {
          provide: ICatDelete,
          useFactory: (catRepository: ICatRepository) => {
            return new CatDeleteUsecase(catRepository)
          },
          inject: [ICatRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ICatDelete)
    repository = app.get(ICatRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatDeleteInput, TestUtils.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<CatDeleteInput>('id')
          }
        ])
      }
    )
  })

  test('when cat not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(null)

    await expect(usecase.execute({ id: TestUtils.mockUUID() }, TestUtils.getMockTracing())).rejects.toThrow(
      ApiNotFoundException
    )
  })

  const mock = new ZodMockSchema(CatEntitySchema)
  const input = mock.generate<CatEntity>()

  test('when cat deleted successfully, should expect a cat deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<CatEntity>(input)
    repository.softRemove = TestUtils.mockResolvedValue<CatEntity>()

    await expect(usecase.execute({ id: TestUtils.mockUUID() }, TestUtils.getMockTracing())).resolves.toEqual({
      ...input,
      deletedAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })
})
