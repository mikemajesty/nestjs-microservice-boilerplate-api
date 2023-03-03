import {
  UserCreateInput,
  UserCreateOutput,
  UserDeleteInput,
  UserDeleteOutput,
  UserGetByIDInput,
  UserGetByIDOutput,
  UserListInput,
  UserListOutput,
  UserUpdateInput,
  UserUpdateOutput
} from './types';

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
