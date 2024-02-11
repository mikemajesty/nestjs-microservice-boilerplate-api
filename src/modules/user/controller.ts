import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators';
import { UserRole } from '@/core/user/entity/user';
import { UserCreateInput, UserCreateOutput } from '@/core/user/use-cases/user-create';
import { UserDeleteInput, UserDeleteOutput } from '@/core/user/use-cases/user-delete';
import { UserGetByIdInput, UserGetByIdOutput } from '@/core/user/use-cases/user-get-by-id';
import { UserListInput, UserListOutput } from '@/core/user/use-cases/user-list';
import { UserUpdateInput, UserUpdateOutput } from '@/core/user/use-cases/user-update';
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
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.BACKOFFICE)
export class UserController {
  constructor(
    private readonly userCreate: IUserCreateAdapter,
    private readonly userUpdate: IUserUpdateAdapter,
    private readonly userDelete: IUserDeleteAdapter,
    private readonly userList: IUserListAdapter,
    private readonly userGetById: IUserGetByIDAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiResponse(SwaggerResponse.create[409])
  @ApiBody(SwaggerRequest.createBody)
  @Version('1')
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<UserCreateOutput> {
    return this.userCreate.execute(body as UserCreateInput, { user, tracing });
  }

  @Put()
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiResponse(SwaggerResponse.update[409])
  @ApiBody(SwaggerRequest.updateBody)
  @Version('1')
  async update(@Req() { body, user, tracing }: ApiRequest): Promise<UserUpdateOutput> {
    return this.userUpdate.execute(body as UserUpdateInput, { user, tracing });
  }

  @Get()
  @ApiQuery(SwaggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwaggerRequest.listQuery.pagination.page)
  @ApiQuery(SwaggerRequest.listQuery.sort)
  @ApiQuery(SwaggerRequest.listQuery.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Version('1')
  async list(@Req() { query }: ApiRequest): Promise<UserListOutput> {
    const input: UserListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.userList.execute(input);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getByID[200])
  @ApiResponse(SwaggerResponse.getByID[404])
  @Version('1')
  async getById(@Req() { params }: ApiRequest): Promise<UserGetByIdOutput> {
    return await this.userGetById.execute(params as UserGetByIdInput);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Version('1')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<UserDeleteOutput> {
    return await this.userDelete.execute(params as UserDeleteInput, { user, tracing });
  }
}
