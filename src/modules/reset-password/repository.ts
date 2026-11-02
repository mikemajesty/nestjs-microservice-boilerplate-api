/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/repository.md
 */
import { Injectable } from '@nestjs/common'
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm'

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password'
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password'
import { TypeORMRepository } from '@/infra/repository/postgres/repository'
import { DateUtils } from '@/utils/date'

import { ResetPasswordSchema } from '../../infra/database/postgres/schemas/reset-password'

@Injectable()
export class ResetPasswordRepository
  extends TypeORMRepository<Model, ResetPasswordEntity>
  implements IResetPasswordRepository
{
  constructor(readonly repository: Repository<Model>) {
    super(repository, ResetPasswordEntity)
  }

  async findByIdUserId(id: string): Promise<ResetPasswordEntity | null> {
    const date = DateUtils.asLuxonDate().minus(1800000).toJSDate()
    const model = await this.repository.findOne({
      where: { user: { id }, createdAt: MoreThan(date) } as FindOptionsWhere<unknown>
    })
    return model ? this.hydrate(model as Model) : null
  }
}

type Model = ResetPasswordSchema & ResetPasswordEntity
