import { z } from 'zod';

import { SendEmailInput } from '@/infra/email';
import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ICryptoAdapter } from '@/libs/crypto';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { UserPasswordEntity, UserPasswordEntitySchema } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const UserCreateSchema = UserEntitySchema.pick({
  email: true,
  name: true,
  roles: true
}).merge(UserPasswordEntitySchema.pick({ password: true }));

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserCreateOutput = CreatedModel;

export class UserCreateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly event: IEventAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(UserCreateSchema)
  async execute(input: UserCreateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserCreateOutput> {
    const entity = new UserEntity({ name: input.name, email: input.email, roles: input.roles });

    const password = this.crypto.createHash(input.password);

    entity.password = new UserPasswordEntity({ password });

    const userExists = await this.userRepository.findOne({
      email: entity.email
    });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    const user = await this.userRepository.create(entity);

    this.loggerService.info({ message: 'user created successfully', obj: { user } });

    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: input.email,
      subject: 'Welcome',
      template: 'welcome',
      payload: { name: input.email }
    });

    tracing.logEvent('user-created', `user: ${entity.email} created by: ${userData.email}`);

    return user;
  }
}
