/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */
import { CatEntity } from '@/core/cat/entity/cat'
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat'
import { MongoRepository } from '@/infra/repository/mongo/repository'
import { DatabaseOperationCommand, DatabaseOperationEnum } from '@/infra/repository/types'
import { MockUtils } from '@/utils/test'
import { TestMongoContainer } from '@/utils/test/e2e/containers'

describe(MongoRepository.name, () => {
  const container = new TestMongoContainer()
  let connection: Awaited<ReturnType<TestMongoContainer['getTestMongo']>>['mongoConnection']
  let model: ReturnType<Cat['repository']>
  let repository: MongoRepository<CatDocument, CatEntity>

  beforeAll(async () => {
    container.mongoDatabase = 'repository_integration'
    ;({ mongoConnection: connection } = await container.getTestMongo())
    model = new Cat().repository(connection)
    repository = new MongoRepository<CatDocument, CatEntity>(model, CatEntity)
  })

  afterEach(async () => {
    await model.deleteMany({})
  })

  afterAll(async () => {
    await connection?.close()
    await container.close()
  })

  test('when searching by alternative fields, should return active matches only', async () => {
    const activeId = MockUtils.UUID()
    const deletedId = MockUtils.UUID()
    await model.create([
      { _id: activeId, name: 'Milo', breed: 'needle', age: 2, deletedAt: null },
      { _id: deletedId, name: 'needle', breed: 'Siamese', age: 3, deletedAt: MockUtils.Date() }
    ])

    const results = await repository.findOr(['name', 'breed'], 'needle')

    expect(results.map(({ id }) => id)).toEqual([activeId])
  })

  test('when soft-deleting a document, should keep it stored but hide it from active searches', async () => {
    const id = MockUtils.UUID()
    await model.create({ _id: id, name: 'Milo', breed: 'Siamese', age: 2, deletedAt: null })

    const result = await repository.softRemove({ id })

    expect(result.id).toBe(id)
    expect(result.deletedAt).toBeInstanceOf(Date)
    await expect(model.exists({ _id: id })).resolves.not.toBeNull()
    await expect(repository.findOr(['id'], id)).resolves.toEqual([])
  })

  test('when updating by entity ID, should return the updated document', async () => {
    const id = MockUtils.UUID()
    await model.create({ _id: id, name: 'Milo', breed: 'Siamese', age: 2, deletedAt: null })

    const updated = await repository.findOneAndUpdate({ id }, { age: 4 })

    expect(updated).toMatchObject({ id, age: 4 })
    await expect(model.findById(id).lean()).resolves.toMatchObject({ age: 4 })
  })

  test('when applying commands, should support all operators, multiple values, and multiple fields', async () => {
    const ids = Array.from({ length: 6 }, () => MockUtils.UUID())
    await model.create([
      { _id: ids[0], name: 'Siamese needle mix', breed: 'Domestic', age: 2, deletedAt: null },
      { _id: ids[1], name: 'Needle point', breed: 'Siamese', age: 3, deletedAt: null },
      { _id: ids[2], name: 'Domestic shorthair', breed: 'Domestic', age: 4, deletedAt: null },
      { _id: ids[3], name: 'Needle archived', breed: 'Domestic', age: 5, deletedAt: MockUtils.Date() },
      { _id: ids[4], name: 'Persian cat', breed: 'Persian', age: 6, deletedAt: null }
    ])

    const contains = await repository.findByCommands([
      { property: 'name', value: ['needle', 'persian'], command: DatabaseOperationEnum.CONTAINS }
    ])
    const notContains = await repository.findByCommands([
      { property: 'name', value: ['needle', 'persian'], command: DatabaseOperationEnum.NOT_CONTAINS }
    ])
    const equal = await repository.findByCommands([
      { property: 'breed', value: ['Siamese', 'Persian'], command: DatabaseOperationEnum.EQUAL }
    ])
    const notEqual = await repository.findByCommands([
      { property: 'breed', value: ['Siamese', 'Persian'], command: DatabaseOperationEnum.NOT_EQUAL }
    ])
    const exact = await repository.findOneByCommands([
      { property: 'breed', value: ['Siamese'], command: DatabaseOperationEnum.EQUAL }
    ])
    const combined = await repository.findByCommands([
      { property: 'name', value: ['needle'], command: DatabaseOperationEnum.CONTAINS },
      { property: 'breed', value: ['Domestic'], command: DatabaseOperationEnum.EQUAL }
    ])
    const byId = await repository.findByCommands([
      { property: 'id', value: [ids[2]], command: DatabaseOperationEnum.EQUAL }
    ])

    expect(contains.map(({ id }) => id).sort()).toEqual([ids[0], ids[1], ids[4]].sort())
    expect(notContains.map(({ id }) => id)).toEqual([ids[2]])
    expect(equal.map(({ id }) => id).sort()).toEqual([ids[1], ids[4]].sort())
    expect(notEqual.map(({ id }) => id).sort()).toEqual([ids[0], ids[2]].sort())
    expect(exact?.id).toBe(ids[1])
    expect(combined.map(({ id }) => id)).toEqual([ids[0]])
    expect(byId.map(({ id }) => id)).toEqual([ids[2]])

    await expect(
      repository.findByCommands([
        { property: 'name', value: ['needle'], command: DatabaseOperationEnum.CONTAINS },
        { property: 'name', value: ['Siamese'], command: DatabaseOperationEnum.NOT_CONTAINS }
      ] as DatabaseOperationCommand<CatEntity>[])
    ).rejects.toThrow()
  })

  test('when paginating active documents, should apply requested ordering across pages', async () => {
    const ids = Array.from({ length: 3 }, () => MockUtils.UUID())
    const pageGroup = MockUtils.UUID()
    await model.create([
      { _id: ids[0], name: pageGroup, breed: 'Domestic', age: 3, deletedAt: null },
      { _id: ids[1], name: pageGroup, breed: 'Domestic', age: 1, deletedAt: null },
      { _id: ids[2], name: pageGroup, breed: 'Domestic', age: 2, deletedAt: null }
    ])
    await repository.softRemove({ id: ids[2] })

    const result = await repository.applyPagination({
      page: 1,
      limit: 1,
      sort: { age: 1 },
      search: { name: pageGroup }
    })

    expect(result).toMatchObject({ total: 2, totalPages: 2, page: 1, limit: 1 })
    expect(result.docs.map(({ id }) => id)).toEqual([ids[1]])

    const secondPage = await repository.applyPagination({
      page: 2,
      limit: 1,
      sort: { age: 1 },
      search: { name: pageGroup }
    })
    expect(secondPage.docs.map(({ id }) => id)).toEqual([ids[0]])
  })

  test('when selecting or excluding fields, should return the requested projection', async () => {
    const id = MockUtils.UUID()
    await model.create({ _id: id, name: 'Milo', breed: 'Siamese', age: 2, deletedAt: null })

    const selected = await repository.findOneWithSelectFields({ id }, ['id', 'name', 'breed', 'age'])
    const selectedMany = await repository.findAllWithSelectFields(['id', 'name', 'breed', 'age'], { id })
    const rawExcluded = await model.findById(id).select('-createdAt').lean()
    const excluded = await repository.findOneWithExcludeFields({ id }, ['createdAt'])
    const excludedMany = await repository.findAllWithExcludeFields(['createdAt'], { id })

    expect(selected).toMatchObject({ id, name: 'Milo', breed: 'Siamese', age: 2 })
    expect(selectedMany).toHaveLength(1)
    expect(selectedMany[0]).toMatchObject({ id, name: 'Milo', breed: 'Siamese', age: 2 })
    expect(excluded).toMatchObject({ id, name: 'Milo', breed: 'Siamese', age: 2 })
    expect(rawExcluded?.createdAt).toBeUndefined()
    expect(excluded?.createdAt).toBeUndefined()
    expect(excludedMany[0]?.createdAt).toBeUndefined()
  })
})
