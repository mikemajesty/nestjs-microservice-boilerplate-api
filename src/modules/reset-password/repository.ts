import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { TypeORMRepository } from '@/infra/repository/postgres/repository';

import { ResetPasswordSchema } from '../../infra/database/postgres/schemas/resetPassword';

type Model = ResetPasswordSchema & ResetPasswordEntity;

@Injectable()
export class UserResetPasswordRepository extends TypeORMRepository<Model> implements IResetPasswordRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository);
  }

  async findByIdUserId(id: string): Promise<ResetPasswordEntity> {
    return await this.repository.findOne({ where: { user: { id } } as FindOptionsWhere<unknown> });
  }
}
