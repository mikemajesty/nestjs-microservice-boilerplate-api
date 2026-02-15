import { DataSource, EntityManager } from 'typeorm'

import { RoleEntity } from '@/core/role/entity/role'
import { UserEntity } from '@/core/user/entity/user'
import { UserPasswordEntity } from '@/core/user/entity/user-password'
import { IUserRepository } from '@/core/user/repository/user'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { RunInTransactionType } from '@/infra/repository'
import { UserModel } from '@/modules/user/repository'
import { CryptoUtils } from '@/utils/crypto'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { TestUtils } from '../../utils'
import { TestFixture } from './adpater'

export class UserFixture implements TestFixture<UserEntity> {
  private password = new UserPasswordEntity({
    id: IDGeneratorUtils.uuid(),
    password: CryptoUtils.createHash('admin')
  })

  public entity = new UserEntity({
    id: IDGeneratorUtils.uuid(),
    email: TestUtils.faker.internet.email(),
    name: TestUtils.faker.person.fullName(),
    password: this.password,
    roles: []
  })

  async clear(manager: DataSource): Promise<void> {
    const dataSource = await manager.initialize()
    const entities = dataSource.entityMetadatas.filter((e) => UserEntity.name === e.name)
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name)
      await repository.query(`TRUNCATE TABLE \"${entity.tableName}\" RESTART IDENTITY CASCADE;`)
    }
  }

  override(entity: UserEntity): UserEntity {
    return { ...this.entity, ...entity } as UserEntity
  }

  async removeRoles(userRepository: IUserRepository, role: RoleEntity): Promise<void> {
    await userRepository.runInTransaction(async (ctx: RunInTransactionType) => {
      const context = ctx as EntityManager
      const user = await context.findOne(UserSchema, { where: { id: this.entity.id }, relations: ['roles'] })
      if (user) {
        user.roles = user.roles.filter((r) => r.id !== role.id)
        await context.save(UserSchema, user)
      }
    })
  }

  async up(userRepository: IUserRepository): Promise<void> {
    await userRepository.runInTransaction(async (ctx: RunInTransactionType) => {
      const context = ctx as EntityManager
      const exists = await context.findOne(UserSchema, { where: { email: this.entity.email } })
      if (exists) return
      await context.save(UserSchema, this.entity.toObject() as UserModel)
    })
  }

  async down(userRepository: IUserRepository): Promise<void> {
    await userRepository.runInTransaction(async (ctx: RunInTransactionType) => {
      const context = ctx as EntityManager
      await context.deleteAll(UserSchema)
    })
  }
}
