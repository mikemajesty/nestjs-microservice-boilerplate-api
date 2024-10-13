import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create';
import { CatDeleteInput, CatDeleteOutput } from '@/core/cat/use-cases/cat-delete';
import { CatGetByIdInput, CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id';
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list';
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  ICatCreateAdapter,
  ICatDeleteAdapter,
  ICatGetByIdAdapter,
  ICatListAdapter,
  ICatUpdateAdapter
} from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('cats')
@ApiTags('cats')
@ApiBearerAuth()
export class CatController {
  constructor(
    private readonly createUsecase: ICatCreateAdapter,
    private readonly updateUsecase: ICatUpdateAdapter,
    private readonly getByIdUsecase: ICatGetByIdAdapter,
    private readonly listUsecase: ICatListAdapter,
    private readonly deleteUsecase: ICatDeleteAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.create[200])
  @ApiBody(SwaggerRequest.create)
  @Version('1')
  @Permission('cat:create')
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
    return await this.createUsecase.execute(body as CatCreateInput, { user, tracing });
  }

  @Put(':id')
  @ApiResponse(SwaggerResponse.update[200])
  @ApiResponse(SwaggerResponse.update[404])
  @ApiBody(SwaggerRequest.update)
  @ApiParam({ name: 'id', required: true, allowEmptyValue: false })
  @Version('1')
  @Permission('cat:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest): Promise<CatUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as CatUpdateInput, { user, tracing });
  }

  @Get('/:id')
  @ApiParam({ name: 'id', required: true, allowEmptyValue: false })
  @ApiResponse(SwaggerResponse.getById[200])
  @ApiResponse(SwaggerResponse.getById[404])
  @Version('1')
  @Permission('cat:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<CatGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as CatGetByIdInput);
  }

  @Get()
  @ApiQuery(SwaggerRequest.list.pagination.limit)
  @ApiQuery(SwaggerRequest.list.pagination.page)
  @ApiQuery(SwaggerRequest.list.sort)
  @ApiQuery(SwaggerRequest.list.search)
  @ApiResponse(SwaggerResponse.list[200])
  @Version('1')
  @Permission('cat:list')
  async list(@Req() { query }: ApiRequest): Promise<CatListOutput> {
    const input: CatListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.listUsecase.execute(input);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', required: true, allowEmptyValue: false })
  @ApiResponse(SwaggerResponse.delete[200])
  @ApiResponse(SwaggerResponse.delete[404])
  @Version('1')
  @Permission('cat:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<CatDeleteOutput> {
    return await this.deleteUsecase.execute(params as CatDeleteInput, { user, tracing });
  }
}
