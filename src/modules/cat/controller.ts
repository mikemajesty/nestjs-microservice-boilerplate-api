import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CatsCreateInput, CatsCreateOutput } from '@/core/cat/use-cases/cats-create';
import { CatsDeleteInput, CatsDeleteOutput } from '@/core/cat/use-cases/cats-delete';
import { CatsGetByIdInput, CatsGetByIdOutput } from '@/core/cat/use-cases/cats-get-by-id';
import { CatsListInput, CatsListOutput } from '@/core/cat/use-cases/cats-list';
import { CatsUpdateInput, CatsUpdateOutput } from '@/core/cat/use-cases/cats-update';
import { Permission } from '@/utils/decorators';
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
export class CatsController {
  constructor(
    private readonly createUsecase: ICatsCreateAdapter,
    private readonly updateUsecase: ICatsUpdateAdapter,
    private readonly getByIdUsecase: ICatsGetByIdAdapter,
    private readonly listUsecase: ICatsListAdapter,
    private readonly deleteUsecase: ICatsDeleteAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiBody(SwaggerRequest.create)
  @Version('1')
  @Permission('cat:create')
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatsCreateOutput> {
    return await this.createUsecase.execute(body as CatsCreateInput, { user, tracing });
  }

  @Put(':id')
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiBody(SwaggerRequest.update)
  @ApiParam({ name: 'id', required: true })
  @Version('1')
  @Permission('cat:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest): Promise<CatsUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as CatsUpdateInput, { user, tracing });
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.getById[200])
  @ApiResponse(SwaggerResponse.getById[404])
  @Version('1')
  @Permission('cat:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<CatsGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as CatsGetByIdInput);
  }

  @Get()
  @ApiQuery(SwaggerRequest.list.pagination.limit)
  @ApiQuery(SwaggerRequest.list.pagination.page)
  @ApiQuery(SwaggerRequest.list.sort)
  @ApiQuery(SwaggerRequest.list.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Version('1')
  @Permission('cat:list')
  async list(@Req() { query }: ApiRequest): Promise<CatsListOutput> {
    const input: CatsListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.listUsecase.execute(input);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Version('1')
  @Permission('cat:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<CatsDeleteOutput> {
    return await this.deleteUsecase.execute(params as CatsDeleteInput, { user, tracing });
  }
}
