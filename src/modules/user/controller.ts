import { Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common';

import { UserChangePasswordInput, UserChangePasswordOutput } from '@/core/user/use-cases/user-change-password';
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdInput, UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { Permission } from '@/utils/decorators';
import { ApiRequest, UserRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IUserChangePasswordAdapter,
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIdAdapter,
  IUserListAdapter,
  IUserUpdateAdapter
} from './adapter';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUsecase: IUserCreateAdapter,
    private readonly updateUsecase: IUserUpdateAdapter,
    private readonly deleteUsecase: IUserDeleteAdapter,
    private readonly listUsecase: IUserListAdapter,
    private readonly getByIdUsecase: IUserGetByIdAdapter,
    private readonly changePassUsecase: IUserChangePasswordAdapter
  ) {}

  @Post()
  @Version('1')
  @Permission('user:create')
  @HttpCode(201)
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<UserCreateOutput> {
    return this.createUsecase.execute(body as UserCreateInput, { user, tracing });
  }

  @Put(':id')
  @Version('1')
  @Permission('user:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest): Promise<UserUpdateOutput> {
    return this.updateUsecase.execute({ ...body, id: params.id } as UserUpdateInput, { user, tracing });
  }

  @Get()
  @Version('1')
  @Permission('user:list')
  async list(@Req() { query }: ApiRequest): Promise<UserListOutput> {
    const input: UserListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.listUsecase.execute(input);
  }

  @Get('/me')
  @Version('1')
  me(@Req() { user }: ApiRequest): UserRequest {
    return user;
  }

  @Get(':id')
  @Version('1')
  @Permission('user:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<UserGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as UserGetByIdInput);
  }

  @Put('change-password/:id')
  @Version('1')
  @Permission('user:changepassword')
  async changePassword(@Req() { params, body }: ApiRequest): Promise<UserChangePasswordOutput> {
    return await this.changePassUsecase.execute({ id: params.id, ...body } as UserChangePasswordInput);
  }

  @Delete(':id')
  @Version('1')
  @Permission('user:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<UserDeleteOutput> {
    return await this.deleteUsecase.execute(params as UserDeleteInput, { user, tracing });
  }
}
