import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';
import { SortHttpSchema } from '@/utils/sort';

import {
  IUserCreateAdapter,
  IUserDeleteAdapter,
  IUserGetByIDAdapter,
  IUserListAdapter,
  IUserUpdateAdapter
} from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';
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

@Controller()
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
  async create(@Body() input: UserCreateInput): UserCreateOutput {
    return this.userCreateUsecase.execute(input);
  }

  @Put('/users')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiResponse(SwagggerResponse.update[409])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Body() input: UserUpdateInput): UserUpdateOutput {
    return this.userUpdateUsecase.execute(input);
  }

  @Get('/users')
  @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwagggerRequest.listQuery.pagination.page)
  @ApiQuery(SwagggerRequest.listQuery.sort)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Query() input: UserListInput): UserListOutput {
    input.sort = SortHttpSchema.parse(input.sort);
    return await this.userListUsecase.execute(input);
  }

  @Get('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Param() input: UserGetByIDInput): UserGetByIDOutput {
    return await this.userGetByIDUsecase.execute(input);
  }

  @Delete('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Param() input: UserDeleteInput): UserDeleteOutput {
    return await this.userDeleteUsecase.execute(input);
  }
}
