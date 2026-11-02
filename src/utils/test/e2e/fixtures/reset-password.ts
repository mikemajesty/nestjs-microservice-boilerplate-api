import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password'
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password'
import { ResetPasswordSchema } from '@/infra/database/postgres/schemas/reset-password'

import { ITestFixture } from './adpater'
import { DatabaseFixture } from './database-fixture'

export class ResetPasswordFixture
  extends DatabaseFixture<ResetPasswordSchema>
  implements Pick<ITestFixture<ResetPasswordEntity>, 'down'>
{
  constructor() {
    super(ResetPasswordSchema)
  }

  async down(repository: IResetPasswordRepository): Promise<void> {
    await this.deleteAllRows(repository)
  }
}
