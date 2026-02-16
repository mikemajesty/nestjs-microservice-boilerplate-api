import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { IBirdGetByIdAdapter } from '@/modules/bird/adapter'
import { ApiNotFoundException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { BirdEntity, BirdEntitySchema } from '../../entity/bird'
import { IBirdRepository } from '../../repository/bird'
import { BirdGetByIdInput, BirdGetByIdUsecase } from '../bird-get-by-id'

describe(BirdGetByIdUsecase.name, () => {
  let usecase: IBirdGetByIdAdapter
  let repository: IBirdRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: IBirdGetByIdAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdGetByIdUsecase(birdRepository)
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile()

    usecase = app.get(IBirdGetByIdAdapter)
    repository = app.get(IBirdRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as BirdGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<BirdGetByIdInput>('id')
          }
        ])
      }
    )
  })

  test('when bird not found, should expect an error', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(null)

    await expect(usecase.execute({ id: TestUtils.mockUUID() })).rejects.toThrow(ApiNotFoundException)
  })

  const mock = new ZodMockSchema(BirdEntitySchema)
  const bird = mock.generate<BirdEntity>()

  test('when bird found, should expect a bird found', async () => {
    repository.findById = TestUtils.mockResolvedValue<BirdEntity>(bird)

    await expect(usecase.execute({ id: bird.id })).resolves.toEqual(bird)
  })
})
