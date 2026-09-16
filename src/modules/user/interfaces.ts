/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { UserChangePasswordInput, UserChangePasswordOutput } from '@/core/user/use-cases/user-change-password'
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create'
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete'
import { UserGetByIdInput, UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id'
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list'
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class IUserCreate implements IUsecase {
  abstract execute(input: UserCreateInput, trace: ApiTracingInput): Promise<UserCreateOutput>
}

export abstract class IUserUpdate implements IUsecase {
  abstract execute(input: UserUpdateInput, trace: ApiTracingInput): Promise<UserUpdateOutput>
}

export abstract class IUserList implements IUsecase {
  abstract execute(input: UserListInput): Promise<UserListOutput>
}

export abstract class IUserDelete implements IUsecase {
  abstract execute(input: UserDeleteInput, trace: ApiTracingInput): Promise<UserDeleteOutput>
}

export abstract class IUserGetById implements IUsecase {
  abstract execute(input: UserGetByIdInput): Promise<UserGetByIdOutput>
}

export abstract class IUserChangePassword implements IUsecase {
  abstract execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput>
}
