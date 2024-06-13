import { Controller, Delete, Get, HttpCode, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RoleAddPermissionInput, RoleAddPermissionOutput } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateInput, RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteInput, RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleGetByIDInput, RoleGetByIDOutput } from '@/core/role/use-cases/role-get-by-id';
import { RoleListInput, RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateInput, RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IRoleAddPermissionAdapter,
  IRoleCreateAdapter,
  IRoleDeleteAdapter,
  IRoleDeletePermissionAdapter,
  IRoleGetByIDAdapter,
  IRoleListAdapter,
  IRoleUpdateAdapter
} from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('roles')
@ApiTags('roles')
@ApiBearerAuth()
export class RoleController {
  constructor(
    private readonly roleCreate: IRoleCreateAdapter,
    private readonly roleUpdate: IRoleUpdateAdapter,
    private readonly roleGetByID: IRoleGetByIDAdapter,
    private readonly roleList: IRoleListAdapter,
    private readonly roleDelete: IRoleDeleteAdapter,
    private readonly roleAddPermission: IRoleAddPermissionAdapter,
    private readonly roleDeletePermission: IRoleDeletePermissionAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiBody(SwaggerRequest.createBody)
  @Permission('role:create')
  async create(@Req() { body }: ApiRequest): Promise<RoleCreateOutput> {
    return await this.roleCreate.execute(body as RoleCreateInput);
  }

  @Put(':id')
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiBody(SwaggerRequest.updateBody)
  @ApiParam({ name: 'id', required: true })
  @Permission('role:update')
  async update(@Req() { body, params }: ApiRequest): Promise<RoleUpdateOutput> {
    return await this.roleUpdate.execute({ ...body, id: params.id } as RoleUpdateInput);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getByID[200])
  @ApiResponse(SwaggerResponse.getByID[404])
  @Permission('role:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<RoleGetByIDOutput> {
    return await this.roleGetByID.execute(params as RoleGetByIDInput);
  }

  @Get()
  @ApiQuery(SwaggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwaggerRequest.listQuery.pagination.page)
  @ApiQuery(SwaggerRequest.listQuery.sort)
  @ApiQuery(SwaggerRequest.listQuery.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Permission('role:list')
  async list(@Req() { query }: ApiRequest): Promise<RoleListOutput> {
    const input: RoleListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.roleList.execute(input);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Permission('role:delete')
  async delete(@Req() { params }: ApiRequest): Promise<RoleDeleteOutput> {
    return await this.roleDelete.execute(params as RoleDeleteInput);
  }

  @Put('/add-permissions/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody(SwaggerRequest.addPermissions)
  @ApiResponse(SwaggerResponse.addPermissions[200])
  @ApiResponse(SwaggerResponse.addPermissions[404])
  @Permission('role:addpermission')
  async addPermissions(@Req() { body, params }: ApiRequest): Promise<RoleAddPermissionOutput> {
    return await this.roleAddPermission.execute({ ...body, id: params.id } as RoleAddPermissionInput);
  }

  @Put('/remove-permissions/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiBody(SwaggerRequest.deletePermissions)
  @ApiResponse(SwaggerResponse.removePermissions[200])
  @ApiResponse(SwaggerResponse.removePermissions[404])
  @HttpCode(200)
  @Permission('role:deletepermission')
  async removePermissions(@Req() { body, params }: ApiRequest): Promise<RoleAddPermissionOutput> {
    return await this.roleDeletePermission.execute({ ...body, id: params.id } as RoleAddPermissionInput);
  }
}
