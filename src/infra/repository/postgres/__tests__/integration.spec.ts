/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */
import { In, Repository } from 'typeorm'

import { RoleEnum } from '@/core/role/entity/role'
import { UserEntity } from '@/core/user/entity/user'
import { RoleSchema } from '@/infra/database/postgres/schemas/role'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { DatabaseOperationEnum } from '@/infra/repository/types'
import { UserModel } from '@/modules/user/repository'
import { MockUtils } from '@/utils/test'
import { TestPostgresContainer } from '@/utils/test/e2e/containers'

import { TypeORMRepository } from '../repository'

describe(TypeORMRepository.name, () => {
  const container = new TestPostgresContainer()
  const originalDatabase = process.env.POSTGRES_DATABASE
  let dataSource: Awaited<ReturnType<TestPostgresContainer['getDataSource']>>
  let repository: TypeORMRepository<UserModel, UserEntity>
  let userIds: string[] = []

  beforeAll(async () => {
    process.env.POSTGRES_DATABASE ??= 'repository_integration'
    container.postgresDatabase = process.env.POSTGRES_DATABASE
    const { postgresConfig } = await container.getPostgres()
    dataSource = await container.getDataSource(postgresConfig)
    repository = new TypeORMRepository(
      dataSource.getRepository(UserSchema) as Repository<UserModel>,
      UserEntity
    )
  })

  afterEach(async () => {
    if (userIds.length > 0) {
      await dataSource.getRepository(UserSchema).delete({ id: In(userIds) })
      userIds = []
    }
  })

  afterAll(async () => {
    await dataSource?.destroy()
    await container.close()
    if (originalDatabase === undefined) {
      delete process.env.POSTGRES_DATABASE
    } else {
      process.env.POSTGRES_DATABASE = originalDatabase
    }
  })

  test('when searching by alternative fields, should return active matches only', async () => {
    const activeByName = MockUtils.UUID()
    const activeByEmail = MockUtils.UUID()
    const deletedId = MockUtils.UUID()
    const searchValue = 'needle@example.com'
    userIds.push(activeByName, activeByEmail, deletedId)
    await dataSource.getRepository(UserSchema).save([
      { id: activeByName, name: searchValue, email: `${activeByName}@example.com` },
      { id: activeByEmail, name: 'Other', email: searchValue },
      { id: deletedId, name: searchValue, email: `${deletedId}@example.com`, deletedAt: MockUtils.Date() }
    ])

    const results = await repository.findOr(['name', 'email'], searchValue)

    expect(results.map(({ id }) => id).sort()).toEqual([activeByEmail, activeByName].sort())
  })

  test('when requesting relations, should include related roles', async () => {
    const role = await dataSource.getRepository(RoleSchema).findOneByOrFail({ name: RoleEnum.USER })
    const id = MockUtils.UUID()
    userIds.push(id)
    await dataSource.getRepository(UserSchema).save({
      id,
      name: 'Test User',
      email: `${id}@example.com`,
      roles: [role]
    })

    const result = await repository.findOneWithRelation({ id }, { roles: true })

    expect(result?.roles.map(({ id: roleId }) => roleId)).toEqual([role.id])
  })

  test('when soft-deleting a user, should hide it from regular lookups', async () => {
    const id = MockUtils.UUID()
    userIds.push(id)
    await dataSource.getRepository(UserSchema).save({
      id,
      name: 'Soft Deleted',
      email: `${id}@example.com`
    })

    const result = await repository.softRemove({ id })

    expect(result.deletedAt).toBeInstanceOf(Date)
    await expect(repository.findById(id)).resolves.toBeNull()
  })

  test('when applying commands, should support operators, multiple values, and multiple fields', async () => {
    const ids = Array.from({ length: 4 }, () => MockUtils.UUID())
    userIds.push(...ids)
    const sharedEmailDomain = `${MockUtils.UUID()}@example.com`
    await dataSource.getRepository(UserSchema).save([
      { id: ids[0], name: 'Siamese needle mix', email: `${ids[0]}${sharedEmailDomain}` },
      { id: ids[1], name: 'Needle point', email: `${ids[1]}${sharedEmailDomain}` },
      { id: ids[2], name: 'Domestic shorthair', email: `${ids[2]}${sharedEmailDomain}` },
      { id: ids[3], name: 'Needle archived', email: `${ids[3]}${sharedEmailDomain}`, deletedAt: MockUtils.Date() }
    ])

    const contains = await repository.findByCommands([
      { property: 'name', value: ['needle'], command: DatabaseOperationEnum.CONTAINS }
    ])
    const notContains = await repository.findByCommands([
      { property: 'name', value: ['needle'], command: DatabaseOperationEnum.NOT_CONTAINS },
      { property: 'email', value: ids.map((id) => `${id}${sharedEmailDomain}`), command: DatabaseOperationEnum.EQUAL }
    ])
    const notEqual = await repository.findByCommands([
      { property: 'name', value: ['Siamese needle mix'], command: DatabaseOperationEnum.NOT_EQUAL },
      { property: 'email', value: ids.map((id) => `${id}${sharedEmailDomain}`), command: DatabaseOperationEnum.EQUAL }
    ])
    const exact = await repository.findOneByCommands([
      { property: 'email', value: [`${ids[0]}${sharedEmailDomain}`], command: DatabaseOperationEnum.EQUAL }
    ])

    expect(contains.map(({ id }) => id).sort()).toEqual(ids.slice(0, 2).sort())
    expect(notContains.map(({ id }) => id)).toEqual([ids[2]])
    expect(notEqual.map(({ id }) => id).sort()).toEqual([ids[1], ids[2]].sort())
    expect(exact?.id).toBe(ids[0])
  })

  test('when paginating active users, should apply ordering across pages and report the full count', async () => {
    const ids = Array.from({ length: 3 }, () => MockUtils.UUID())
    const pageGroup = MockUtils.UUID()
    userIds.push(...ids)
    await dataSource.getRepository(UserSchema).save([
      { id: ids[0], name: pageGroup, email: `a-${pageGroup}@example.com` },
      { id: ids[1], name: pageGroup, email: `b-${pageGroup}@example.com` },
      { id: ids[2], name: pageGroup, email: `c-${pageGroup}@example.com` }
    ])
    await repository.softRemove({ id: ids[2] })

    const result = await repository.applyPagination({
      page: 1,
      limit: 1,
      sort: { email: 1 },
      search: { name: pageGroup }
    })

    expect(result).toMatchObject({ total: 2, totalPages: 2, page: 1, limit: 1 })
    expect(result.docs.map(({ id }) => id)).toEqual([ids[0]])

    const secondPage = await repository.applyPagination({
      page: 2,
      limit: 1,
      sort: { email: 1 },
      search: { name: pageGroup }
    })
    expect(secondPage.docs.map(({ id }) => id)).toEqual([ids[1]])
  })

  test('when selecting or excluding fields, should return the requested projection', async () => {
    const id = MockUtils.UUID()
    userIds.push(id)
    await dataSource.getRepository(UserSchema).save({
      id,
      name: 'Selected User',
      email: `${id}@example.com`
    })

    const selected = await repository.findOneWithSelectFields({ id }, ['id', 'name', 'email'])
    const selectedMany = await repository.findAllWithSelectFields(['id', 'name', 'email'], { id })
    const excluded = await repository.findOneWithExcludeFields({ id }, ['updatedAt'])
    const excludedMany = await repository.findAllWithExcludeFields(['updatedAt'], { id })

    expect(selected).toMatchObject({ id, name: 'Selected User', email: `${id}@example.com` })
    expect(selectedMany).toHaveLength(1)
    expect(selectedMany[0]).toMatchObject({ id, name: 'Selected User', email: `${id}@example.com` })
    expect(excluded).toMatchObject({ id, name: 'Selected User', email: `${id}@example.com` })
    expect(excluded?.updatedAt).toBeUndefined()
    expect(excludedMany[0]?.updatedAt).toBeUndefined()
  })

  test('when running transactions, should commit success and roll back failures', async () => {
    const committedId = MockUtils.UUID()
    userIds.push(committedId)
    await repository.runInTransaction(async (manager) => {
      await manager.save(UserSchema, {
        id: committedId,
        name: 'Committed',
        email: `${committedId}@example.com`
      })
    })
    await expect(repository.findById(committedId)).resolves.toMatchObject({ id: committedId })

    const rolledBackId = MockUtils.UUID()
    userIds.push(rolledBackId)
    await expect(
      repository.runInTransaction(async (manager) => {
        await manager.save(UserSchema, {
          id: rolledBackId,
          name: 'Rolled back',
          email: `${rolledBackId}@example.com`
        })
        throw new Error('force rollback')
      })
    ).rejects.toThrow('force rollback')
    await expect(repository.findById(rolledBackId)).resolves.toBeNull()
  })
})
