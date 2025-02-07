import { Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common';

import { PermissionCreateInput, PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteInput, PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIdInput, PermissionGetByIdOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListInput, PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateInput, PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IPermissionCreateAdapter,
  IPermissionDeleteAdapter,
  IPermissionGetByIdAdapter,
  IPermissionListAdapter,
  IPermissionUpdateAdapter
} from './adapter';

@Controller('permissions')
export class PermissionController {
  constructor(
    private readonly createUsecase: IPermissionCreateAdapter,
    private readonly updateUsecase: IPermissionUpdateAdapter,
    private readonly getByIdUsecase: IPermissionGetByIdAdapter,
    private readonly listUsecase: IPermissionListAdapter,
    private readonly deleteUsecase: IPermissionDeleteAdapter
  ) {}

  @Post()
  @Version('1')
  @Permission('permission:create')
  @HttpCode(201)
  async create(@Req() { body }: ApiRequest): Promise<PermissionCreateOutput> {
    return await this.createUsecase.execute(body as PermissionCreateInput);
  }

  @Put(':id')
  @Version('1')
  @Permission('permission:update')
  async update(@Req() { body, params }: ApiRequest): Promise<PermissionUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as PermissionUpdateInput);
  }

  @Get(':id')
  @Version('1')
  @Permission('permission:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<PermissionGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as PermissionGetByIdInput);
  }

  @Get()
  @Version('1')
  @Permission('permission:list')
  async list(@Req() { query }: ApiRequest): Promise<PermissionListOutput> {
    const input: PermissionListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.listUsecase.execute(input);
  }

  @Delete(':id')
  @Version('1')
  @Permission('permission:delete')
  async delete(@Req() { params }: ApiRequest): Promise<PermissionDeleteOutput> {
    return await this.deleteUsecase.execute(params as PermissionDeleteInput);
  }
}
