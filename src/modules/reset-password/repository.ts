import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password';
import { ResetPassword, ResetPasswordDocument } from '@/infra/database/mongo/schemas/reset-password';
import { MongoRepository } from '@/infra/repository';
import { MongoRepositoryModelSessionType, MongoRepositorySession } from '@/utils/database/mongoose';

@Injectable()
export class ResetPasswordRepository
  extends MongoRepository<ResetPasswordDocument>
  implements IResetPasswordRepository
{
  constructor(
    @InjectModel(ResetPassword.name)
    readonly entity: MongoRepositoryModelSessionType<PaginateModel<ResetPasswordDocument>>
  ) {
    super(entity);
  }

  async startSession<TTransaction = MongoRepositorySession>(): Promise<TTransaction> {
    const session = await this.entity.connection.startSession();
    session.startTransaction();

    return session as TTransaction;
  }
}
