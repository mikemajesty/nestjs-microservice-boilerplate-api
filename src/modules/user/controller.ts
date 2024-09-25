import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

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
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
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
  @ApiResponse(SwaggerResponse.create[200])
  @ApiResponse(SwaggerResponse.create[409])
  @ApiBody(SwaggerRequest.create)
  @Version('1')
  @Permission('user:create')
  async create(@Req() { body, user, tracing }: ApiRequest<UserCreateInput>): Promise<UserCreateOutput> {
    return this.createUsecase.execute(body, { user, tracing });
  }

  @Put(':id')
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiResponse(SwaggerResponse.update[409])
  @ApiBody(SwaggerRequest.update)
  @ApiParam({ name: 'id', required: true })
  @Version('1')
  @Permission('user:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest<UserUpdateInput>): Promise<UserUpdateOutput> {
    return this.updateUsecase.execute({ ...body, id: params.id }, { user, tracing });
  }

  @Get()
  @ApiQuery(SwaggerRequest.list.pagination.limit)
  @ApiQuery(SwaggerRequest.list.pagination.page)
  @ApiQuery(SwaggerRequest.list.sort)
  @ApiQuery(SwaggerRequest.list.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Version('1')
  @Permission('user:list')
  async list(@Req() { query }: ApiRequest<UserListInput>): Promise<UserListOutput> {
    const input: UserListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.listUsecase.execute(input);
  }

  @Get('/me')
  @ApiResponse(SwaggerResponse.me[200])
  @Version('1')
  me(@Req() { user }: ApiRequest<null>): UserRequest {
    return user;
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getById[200])
  @ApiResponse(SwaggerResponse.getById[404])
  @Version('1')
  @Permission('user:getbyid')
  async getById(@Req() { params }: ApiRequest<UserGetByIdInput>): Promise<UserGetByIdOutput> {
    return await this.getByIdUsecase.execute(params);
  }

  @Put('change-password/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody(SwaggerRequest.changePassword)
  @ApiResponse(SwaggerResponse.changePassword[200])
  @ApiResponse(SwaggerResponse.changePassword[404])
  @ApiResponse(SwaggerResponse.changePassword[400])
  @Version('1')
  @Permission('user:changepassword')
  async changePassword(
    @Req() { params, body }: ApiRequest<UserChangePasswordInput>
  ): Promise<UserChangePasswordOutput> {
    return await this.changePassUsecase.execute({ id: params.id, ...body });
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Version('1')
  @Permission('user:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest<UserDeleteInput>): Promise<UserDeleteOutput> {
    return await this.deleteUsecase.execute(params, { user, tracing });
  }
}
