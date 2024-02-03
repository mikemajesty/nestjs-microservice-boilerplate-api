import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators';
import { CatsCreateInput, CatsCreateOutput } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteInput, CatsDeleteOutput } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdInput, CatsGetByIdOutput } from '@/core/cats/use-cases/cats-get-by-id';
import { CatsListInput, CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateInput, CatsUpdateOutput } from '@/core/cats/use-cases/cats-update';
import { UserRole } from '@/core/user/entity/user';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  ICatsCreateAdapter,
  ICatsDeleteAdapter,
  ICatsGetByIdAdapter,
  ICatsListAdapter,
  ICatsUpdateAdapter
} from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('cats')
@ApiTags('cats')
@ApiBearerAuth()
@Roles(UserRole.USER)
export class CatsController {
  constructor(
    private readonly catsCreate: ICatsCreateAdapter,
    private readonly catsUpdate: ICatsUpdateAdapter,
    private readonly catsGetById: ICatsGetByIdAdapter,
    private readonly catsList: ICatsListAdapter,
    private readonly catsDelete: ICatsDeleteAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiBody(SwaggerRequest.createBody)
  @Version('1')
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatsCreateOutput> {
    return await this.catsCreate.execute(body as CatsCreateInput, { user, tracing });
  }

  @Put()
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiBody(SwaggerRequest.updateBody)
  @Version('1')
  async update(@Req() { body, user, tracing }: ApiRequest): Promise<CatsUpdateOutput> {
    return await this.catsUpdate.execute(body as CatsUpdateInput, { user, tracing });
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getByID[200])
  @ApiResponse(SwaggerResponse.getByID[404])
  @Version('1')
  async getById(@Req() { params }: ApiRequest): Promise<CatsGetByIdOutput> {
    return await this.catsGetById.execute(params as CatsGetByIdInput);
  }

  @Get()
  @ApiQuery(SwaggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwaggerRequest.listQuery.pagination.page)
  @ApiQuery(SwaggerRequest.listQuery.sort)
  @ApiQuery(SwaggerRequest.listQuery.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Version('1')
  async list(@Req() { query }: ApiRequest): Promise<CatsListOutput> {
    const input: CatsListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.catsList.execute(input);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Version('1')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<CatsDeleteOutput> {
    return await this.catsDelete.execute(params as CatsDeleteInput, { user, tracing });
  }
}
