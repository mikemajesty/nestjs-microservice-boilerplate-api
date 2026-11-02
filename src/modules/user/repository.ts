/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { UserEntity } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list'
import { UserSchema } from '@/infra/database/postgres/schemas/user'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { handleDatabaseError } from '@/infra/repository/util'
import { SearchTypeEnum, TransformSort, TransformTypeOrmSearch } from '@/utils/decorators'
import { ApiUnprocessableEntityException } from '@/utils/exception'

@Injectable()
export class UserRepository extends TypeORMRepository<UserModel, UserEntity> implements IUserRepository {
  constructor(readonly repository: Repository<UserModel>) {
    super(repository, UserEntity)
  }

  @TransformTypeOrmSearch<UserEntity>([
    { name: 'email', type: SearchTypeEnum.equal },
    { name: 'name', type: SearchTypeEnum.like }
  ])
  @TransformSort<UserEntity>({ name: 'email' }, { name: 'name' }, { name: 'createdAt' })
  async paginate(input: UserListInput): Promise<UserListOutput> {
    return this.applyPagination(input, { roles: true })
  }

  /**
   * Executes a function within a transaction that has a specified deadline.
   * @param timeoutMs The maximum time in milliseconds the transaction is allowed to run.
   * @param fn The function to execute within the transaction.
   * @returns The result of the function.
   * @throws ApiUnprocessableEntityException if the timeout is not a positive integer.
   * @throws DatabaseError if any database error occurs during the transaction.
   */
  async withDeadline<R>(timeoutMs: number, fn: (repository: UserRepository) => Promise<R>): Promise<R> {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new ApiUnprocessableEntityException('User repository deadline must be a positive integer in milliseconds')
    }

    const queryRunner = this.repository.manager.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.query(`SET LOCAL statement_timeout = ${timeoutMs}`)

      const repository = new UserRepository(queryRunner.manager.getRepository(this.repository.target))
      const result = await fn(repository)

      await queryRunner.commitTransaction()
      return result
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }

      throw handleDatabaseError({ error, context: `${UserRepository.name}.withDeadline` })
    } finally {
      await queryRunner.release()
    }
  }
}

export type UserModel = UserSchema & UserEntity
