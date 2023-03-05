import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';

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
  UserCreateSchema,
  UserDeleteInput,
  UserDeleteOutput,
  UserDeleteSchema,
  UserGetByIDInput,
  UserGetByIDOutput,
  UserGetByIdSchema,
  UserListInput,
  UserListOutput,
  UserListSchema,
  UserUpdateInput,
  UserUpdateOutput,
  UserUpdateSchema
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
    const model = UserCreateSchema.parse(input);
    return this.userCreateUsecase.execute(model);
  }

  @Put('/users')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiResponse(SwagggerResponse.update[409])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Body() input: UserUpdateInput): UserUpdateOutput {
    const model = UserUpdateSchema.parse(input);
    return this.userUpdateUsecase.execute(model);
  }

  @Get('/users')
  @ApiQuery(SwagggerRequest.listQuery)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Query() input: UserListInput): UserListOutput {
    const model = UserListSchema.parse(input);
    return await this.userListUsecase.execute(model);
  }

  @Get('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Param() input: UserGetByIDInput): UserGetByIDOutput {
    const model = UserGetByIdSchema.parse(input);
    return await this.userGetByIDUsecase.execute(model);
  }

  @Delete('/users/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Param() input: UserDeleteInput): UserDeleteOutput {
    const model = UserDeleteSchema.parse(input);
    return await this.userDeleteUsecase.execute(model);
  }
}
