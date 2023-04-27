import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIDInput, UserGetByIDOutput } from '@/core/user/use-cases/user-getByID';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update';

export abstract class IUserCreateAdapter {
  abstract execute(input: UserCreateInput): Promise<UserCreateOutput>;
}

export abstract class IUserUpdateAdapter {
  abstract execute(input: UserUpdateInput): Promise<UserUpdateOutput>;
}

export abstract class IUserListAdapter {
  abstract execute(input: UserListInput): Promise<UserListOutput>;
}

export abstract class IUserDeleteAdapter {
  abstract execute(input: UserDeleteInput): Promise<UserDeleteOutput>;
}

export abstract class IUserGetByIDAdapter {
  abstract execute(input: UserGetByIDInput): Promise<UserGetByIDOutput>;
}
