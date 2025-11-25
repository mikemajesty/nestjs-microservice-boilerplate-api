import { RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { SendEmailInput } from '@/infra/email';
import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer, InputValidator } from '@/utils/validator';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { UserPasswordEntity, UserPasswordEntitySchema } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const UserCreateSchema = UserEntitySchema.pick({
  email: true,
  name: true
})
  .merge(UserPasswordEntitySchema.pick({ password: true }))
  .merge(InputValidator.object({ roles: InputValidator.array(InputValidator.enum(RoleEnum)).min(1) }));

export class UserCreateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly event: IEventAdapter,
    private readonly roleRepository: IRoleRepository
  ) {}

  @ValidateSchema(UserCreateSchema)
  async execute(input: UserCreateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserCreateOutput> {
    const roles = await this.roleRepository.findIn({ name: input.roles });

    if (roles.length < input.roles.length) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const entity = new UserEntity({ id: UUIDUtils.create(), name: input.name, email: input.email, roles });

    const passwordEntity = new UserPasswordEntity({ id: UUIDUtils.create(), password: input.password });

    passwordEntity.createPassword();

    entity.password = passwordEntity;

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
      payload: { name: input.name }
    });

    tracing.logEvent('user-created', `user: ${entity.email} created by: ${userData.email}`);

    return user;
  }
}

export type UserCreateInput = Infer<typeof UserCreateSchema>;
export type UserCreateOutput = CreatedModel;
