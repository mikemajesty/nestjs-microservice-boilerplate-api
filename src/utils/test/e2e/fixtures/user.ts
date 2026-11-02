import { EntityManager } from 'typeorm'

import { RoleEntity } from '@/core/role/entity/role'
import { UserEntity } from '@/core/user/entity/user'
import { UserPasswordEntity } from '@/core/user/entity/user-password'
import { IUserRepository } from '@/core/user/repository/user'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { IRepository, RunInTransactionType } from '@/infra/repository'
import { createRelations } from '@/infra/repository/util'
import { UserModel } from '@/modules/user/repository'
import { CryptoUtils } from '@/utils/crypto'
import { IDGeneratorUtils } from '@/utils/id-generator'

import { MockUtils } from '../../mock'
import { ITestFixture } from './adpater'
import { DatabaseFixture } from './database-fixture'

export class UserFixture extends DatabaseFixture<UserSchema> implements ITestFixture<UserEntity> {
  private password = new UserPasswordEntity({
    id: IDGeneratorUtils.uuid(),
    password: CryptoUtils.createHash('admin')
  })

  public entity = new UserEntity({
    id: IDGeneratorUtils.uuid(),
    email: MockUtils.faker.internet.email(),
    name: MockUtils.faker.person.fullName(),
    password: this.password,
    roles: []
  })

  constructor() {
    super(UserSchema)
  }

  override(overrides: Partial<UserEntity>): UserEntity {
    return new UserEntity({ ...this.entity.toData(), ...overrides })
  }

  async removeRoles(userRepository: IUserRepository, role: RoleEntity): Promise<void> {
    await userRepository.runInTransaction(async (ctx: RunInTransactionType) => {
      const context = ctx as EntityManager
      const user = await context.findOne(UserSchema, {
        where: { id: this.entity.id },
        relations: createRelations<UserEntity>({ roles: true })
      })
      if (user) {
        user.roles = user.roles.filter((r) => r.id !== role.id)
        await context.save(UserSchema, user as UserModel)
      }
    })
  }

  async up(userRepository: IUserRepository): Promise<void> {
    await this.insertIfNotExists({
      repository: userRepository,
      entities: [this.entity],
      where: (entity) => ({ email: entity.email })
    })
  }

  async down(repository: IRepository<UserEntity>): Promise<void> {
    await this.deleteAllRows(repository)
  }
}
