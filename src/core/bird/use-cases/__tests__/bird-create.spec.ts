import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { CreatedModel } from '@/infra/repository'
import { IBirdCreateAdapter } from '@/modules/bird/adapter'
import { ApiInternalServerException } from '@/utils/exception'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { BirdEntitySchema } from '../../entity/bird'
import { IBirdRepository } from '../../repository/bird'
import { BirdCreateInput, BirdCreateUsecase } from '../bird-create'

describe(BirdCreateUsecase.name, () => {
  let usecase: IBirdCreateAdapter
  let repository: IBirdRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IBirdRepository,
          useValue: {}
        },
        {
          provide: IBirdCreateAdapter,
          useFactory: (birdRepository: IBirdRepository) => {
            return new BirdCreateUsecase(birdRepository)
          },
          inject: [IBirdRepository]
        }
      ]
    }).compile()

    usecase = app.get(IBirdCreateAdapter)
    repository = app.get(IBirdRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as BirdCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<BirdCreateInput>('name')
          }
        ])
      }
    )
  })

  const mock = new ZodMockSchema(BirdEntitySchema)
  const input = mock.generate()

  test('when bird created successfully, should expect a bird created', async () => {
    repository.create = TestUtils.mockResolvedValue<CreatedModel>(input)

    await expect(usecase.execute(input)).resolves.toEqual(input)
  })

  test('when transaction throw an error, should expect an error', async () => {
    repository.create = TestUtils.mockRejectedValue(new ApiInternalServerException())

    await expect(usecase.execute(input)).rejects.toThrow(ApiInternalServerException)
  })
})
