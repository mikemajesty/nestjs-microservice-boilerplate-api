import { IRepository } from '@/infra/repository';

import { ResetPasswordEntity } from '../entity/reset-password';

export abstract class IResetPasswordRepository extends IRepository<ResetPasswordEntity> {
  abstract findByIdUserId(id: string): Promise<ResetPasswordEntity>;
}
