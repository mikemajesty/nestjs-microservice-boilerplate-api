import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { BirdDeleteInput, BirdDeleteUsecase } from '@/core/bird/use-cases/bird-delete'
import { LoggerModule } from '@/infra/logger'
import { UpdatedModel } from '@/infra/repository'
import { IBirdDeleteAdapter } from '@/modules/bird/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../../entity/bird'
import { IBirdRepository } from '../../repository/bird'

describe(BirdDeleteUsecase.name, () => {
  let usecase: IBirdDeleteAdapter
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
          provide: IBirdDeleteAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdDeleteUsecase(birdRepository)
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile()

    usecase = app.get(IBirdDeleteAdapter)
    repository = app.get(IBirdRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as BirdDeleteInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<BirdDeleteInput>('id')
          }
        ])
      }
    )
  })

  const mock = new ZodMockSchema(BirdEntitySchema)
  const bird = mock.generate<BirdEntity>()

  test('when bird not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(null)

    await expect(usecase.execute({ id: TestUtils.mockUUID() })).rejects.toThrow(ApiNotFoundException)
  })

  test('when bird deleted successfully, should expect a bird deleted', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(bird)
    repository.updateOne = TestUtils.mockResolvedValue<UpdatedModel>()

    await expect(usecase.execute({ id: bird.id })).resolves.toEqual({
      ...bird,
      deletedAt: expect.any(Date)
    })
  })
})
