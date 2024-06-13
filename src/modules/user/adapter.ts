import { UserChangePasswordInput, UserChangePasswordOutput } from '@/core/user/use-cases/user-change-password';
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdInput, UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

export abstract class IUserCreateAdapter implements IUsecase {
  abstract execute(input: UserCreateInput, trace: ApiTrancingInput): Promise<UserCreateOutput>;
}

export abstract class IUserUpdateAdapter implements IUsecase {
  abstract execute(input: UserUpdateInput, trace: ApiTrancingInput): Promise<UserUpdateOutput>;
}

export abstract class IUserListAdapter implements IUsecase {
  abstract execute(input: UserListInput): Promise<UserListOutput>;
}

export abstract class IUserDeleteAdapter implements IUsecase {
  abstract execute(input: UserDeleteInput, trace: ApiTrancingInput): Promise<UserDeleteOutput>;
}

export abstract class IUserGetByIdAdapter implements IUsecase {
  abstract execute(input: UserGetByIdInput): Promise<UserGetByIdOutput>;
}

export abstract class IUserChangePasswordAdapter implements IUsecase {
  abstract execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput>;
}
