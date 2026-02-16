import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { UpdatedModel } from '@/infra/repository'
import { IBirdUpdateAdapter } from '@/modules/bird/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../../entity/bird'
import { IBirdRepository } from '../../repository/bird'
import { BirdUpdateInput, BirdUpdateUsecase } from '../bird-update'

describe(BirdUpdateUsecase.name, () => {
  let usecase: IBirdUpdateAdapter
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
          provide: IBirdUpdateAdapter,
          useFactory: (birdRepository: IBirdRepository, logger: ILoggerAdapter) => {
            return new BirdUpdateUsecase(birdRepository, logger)
          },
          inject: [IBirdRepository, ILoggerAdapter]
        }
      ]
    }).compile()

    usecase = app.get(IBirdUpdateAdapter)
    repository = app.get(IBirdRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as BirdUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<BirdUpdateInput>('id')
          }
        ])
      }
    )
  })

  const mock = new ZodMockSchema(BirdEntitySchema)
  const input = mock.generate<BirdEntity>({
    overrides: {
      updatedAt: null,
      createdAt: null,
      deletedAt: null
    }
  })

  test('when bird not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(null)

    await expect(usecase.execute({ id: TestUtils.mockUUID() })).rejects.toThrow(ApiNotFoundException)
  })

  test('when bird updated successfully, should expect a bird updated', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(input)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>()

    await expect(usecase.execute({ id: TestUtils.mockUUID() })).resolves.toEqual(input)
  })
})
