import { Controller, Delete, Get, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PermissionCreateInput, PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteInput, PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIDInput, PermissionGetByIDOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateInput, PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IPermissionCreateAdapter,
  IPermissionDeleteAdapter,
  IPermissionGetByIDAdapter,
  IPermissionListAdapter,
  IPermissionUpdateAdapter
} from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('permissions')
@ApiTags('permissions')
@ApiBearerAuth()
export class PermissionController {
  constructor(
    private readonly permissionCreate: IPermissionCreateAdapter,
    private readonly permissionUpdate: IPermissionUpdateAdapter,
    private readonly permissionGetByID: IPermissionGetByIDAdapter,
    private readonly permissionList: IPermissionListAdapter,
    private readonly permissionDelete: IPermissionDeleteAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiBody(SwaggerRequest.createBody)
  @Permission('permission:create')
  async create(@Req() { body }: ApiRequest): Promise<PermissionCreateOutput> {
    return await this.permissionCreate.execute(body as PermissionCreateInput);
  }

  @Put(':id')
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiBody(SwaggerRequest.updateBody)
  @ApiParam({ name: 'id', required: true })
  @Permission('permission:update')
  async update(@Req() { body, params }: ApiRequest): Promise<PermissionUpdateOutput> {
    return await this.permissionUpdate.execute({ ...body, id: params.id } as PermissionUpdateInput);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getByID[200])
  @ApiResponse(SwaggerResponse.getByID[404])
  @Permission('permission:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<PermissionGetByIDOutput> {
    return await this.permissionGetByID.execute(params as PermissionGetByIDInput);
  }

  @Get()
  @ApiQuery(SwaggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwaggerRequest.listQuery.pagination.page)
  @ApiQuery(SwaggerRequest.listQuery.sort)
  @ApiQuery(SwaggerRequest.listQuery.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Permission('permission:list')
  async list(@Req() { query }: ApiRequest): Promise<PermissionListOutput> {
    const input: PermissionListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.permissionList.execute(input);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Permission('permission:delete')
  async delete(@Req() { params }: ApiRequest): Promise<PermissionDeleteOutput> {
    return await this.permissionDelete.execute(params as PermissionDeleteInput);
  }
}
