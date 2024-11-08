import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { TypeORMRepository } from '@/infra/repository/postgres/repository';
import { DateUtils } from '@/utils/date';

import { ResetPasswordSchema } from '../../infra/database/postgres/schemas/reset-password';

@Injectable()
export class ResetPasswordRepository extends TypeORMRepository<Model> implements IResetPasswordRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository);
  }

  async findByIdUserId(id: string): Promise<ResetPasswordEntity> {
    const date = DateUtils.getDate().minus(1800000).toJSDate();
    return (await this.repository.findOne({
      where: { user: { id }, createdAt: MoreThan(date) } as FindOptionsWhere<unknown>
    })) as Model;
  }
}

type Model = ResetPasswordSchema & ResetPasswordEntity;
