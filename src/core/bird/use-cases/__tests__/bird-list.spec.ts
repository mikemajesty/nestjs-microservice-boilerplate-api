import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { BirdListInput, BirdListOutput, BirdListSchema, BirdListUsecase } from '@/core/bird/use-cases/bird-list'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { IBirdListAdapter } from '@/modules/bird/adapter'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../../entity/bird'
import { IBirdRepository } from '../../repository/bird'

describe(BirdListUsecase.name, () => {
  let usecase: IBirdListAdapter
  let repository: IBirdRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: IBirdListAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdListUsecase(birdRepository)
          },
          inject: [IBirdRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IBirdListAdapter)
    repository = app.get(IBirdRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as BirdListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<BirdListInput>('search')
          }
        ])
      }
    )
  })

  const mock = new ZodMockSchema(BirdEntitySchema)
  const docs = mock.generateMany(2, {
    overrides: {
      deletedAt: null
    }
  })

  const input = new ZodMockSchema(BirdListSchema).generate()
  test('when birds are found, should expect an user list', async () => {
    const output = { docs: docs as BirdEntity[], page: 1, limit: 1, total: 1 }
    repository.paginate = TestUtils.mockResolvedValue<BirdListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: output.docs,
      page: 1,
      limit: 1,
      total: 1
    })
  })

  test('when birds not found, should expect an empty list', async () => {
    const output = { docs: docs as BirdEntity[], page: 1, limit: 1, total: 1 }
    repository.paginate = TestUtils.mockResolvedValue<BirdListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual(output)
  })
})
