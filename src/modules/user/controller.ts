import { Controller, Delete, Get, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIDInput, UserGetByIDOutput } from '@/core/user/use-cases/user-getByID';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update';
import { Roles } from '@/utils/decorators/role.decorator';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIDAdapter,
  IUserListAdapter,
  IUserUpdateAdapter
} from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';

@Controller({ version: "1" })
@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.BACKOFFICE)
export class UserController {
  constructor(
    private readonly userCreateUsecase: IUserCreateAdapter,
    private readonly userUpdateUsecase: IUserUpdateAdapter,
    private readonly userDeleteUsecase: IUserDeleteAdapter,
    private readonly userListUsecase: IUserListAdapter,
    private readonly userGetByIDUsecase: IUserGetByIDAdapter
  ) {}

  @Post('/users')
  @ApiResponse(SwagggerResponse.create[200])
  @ApiResponse(SwagggerResponse.create[409])
  @ApiBody(SwagggerRequest.createBody)
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<UserCreateOutput> {
    return this.userCreateUsecase.execute(body as UserCreateInput, { user, tracing });
  }

  @Put('/users')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiResponse(SwagggerResponse.update[409])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Req() { body, user, tracing }: ApiRequest): Promise<UserUpdateOutput> {
    return this.userUpdateUsecase.execute(body as UserUpdateInput, { user, tracing });
  }

  @Get('/users')
  @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwagggerRequest.listQuery.pagination.page)
  @ApiQuery(SwagggerRequest.listQuery.sort)
  @ApiQuery(SwagggerRequest.listQuery.search)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Req() { query }: ApiRequest): Promise<UserListOutput> {
    const input: UserListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.userListUsecase.execute(input);
  }

  @Get('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Req() { params }: ApiRequest): Promise<UserGetByIDOutput> {
    return await this.userGetByIDUsecase.execute(params as UserGetByIDInput);
  }

  @Delete('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<UserDeleteOutput> {
    return await this.userDeleteUsecase.execute(params as UserDeleteInput, { user, tracing });
  }
}
