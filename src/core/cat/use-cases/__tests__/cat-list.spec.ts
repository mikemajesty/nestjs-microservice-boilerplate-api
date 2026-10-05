/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { ZodMockSchema } from '@mikemajesty/zod-mock-schema'
import { Test } from '@nestjs/testing'

import { CatListInput, CatListOutput, CatListSchema, CatListUsecase } from '@/core/cat/use-cases/cat-list'
import { ICatList } from '@/modules/cat/interfaces'
import { TestUtils } from '@/utils/test/utils'
import { ZodExceptionIssue } from '@/utils/validator'

import { CatEntity, CatEntitySchema } from '../../entity/cat'
import { ICatRepository } from '../../repository/cat'

describe(CatListUsecase.name, () => {
  let usecase: ICatList
  let repository: ICatRepository

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(ICatRepository),
        {
          provide: ICatList,
          useFactory: (catRepository: ICatRepository) => {
            return new CatListUsecase(catRepository)
          },
          inject: [ICatRepository]
        }
      ]
    }).compile()

    usecase = app.get(ICatList)
    repository = app.get(ICatRepository)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as CatListInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<CatListInput>('search')
          }
        ])
      }
    )
  })

  const mock = new ZodMockSchema(CatEntitySchema)
  const docs = mock.generateMany<CatEntity>(2, {
    overrides: {
      deletedAt: null
    }
  })

  const input = new ZodMockSchema(CatListSchema).generate()
  test('when cats are found, should expect a cat list', async () => {
    const output = { docs, page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual({
      docs: output.docs,
      page: 1,
      limit: 1,
      total: 1,
      totalPages: 1
    })
  })

  test('when cats not found, should expect an empty list', async () => {
    const output = { docs, page: 1, limit: 1, total: 1, totalPages: 1 }
    repository.paginate = TestUtils.mockResolvedValue<CatListOutput>(output)

    await expect(usecase.execute(input)).resolves.toEqual(output)
  })
})
