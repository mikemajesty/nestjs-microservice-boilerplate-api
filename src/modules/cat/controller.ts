import { Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common';

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

@Controller('cats')
export class CatController {
  constructor(
    private readonly createUsecase: ICatCreateAdapter,
    private readonly updateUsecase: ICatUpdateAdapter,
    private readonly getByIdUsecase: ICatGetByIdAdapter,
    private readonly listUsecase: ICatListAdapter,
    private readonly deleteUsecase: ICatDeleteAdapter
  ) {}

  @Post()
  @Version('1')
  @Permission('cat:create')
  @HttpCode(201)
  async create(@Req() { body, user, tracing }: ApiRequest): Promise<CatCreateOutput> {
    return await this.createUsecase.execute(body as CatCreateInput, { user, tracing });
  }

  @Put(':id')
  @Version('1')
  @Permission('cat:update')
  async update(@Req() { body, user, tracing, params }: ApiRequest): Promise<CatUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as CatUpdateInput, { user, tracing });
  }

  @Get(':id')
  @Version('1')
  @Permission('cat:getbyid')
  async getById(@Req() { params }: ApiRequest): Promise<CatGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as CatGetByIdInput);
  }

  @Get()
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

  @Delete(':id')
  @Version('1')
  @Permission('cat:delete')
  async delete(@Req() { params, user, tracing }: ApiRequest): Promise<CatDeleteOutput> {
    return await this.deleteUsecase.execute(params as CatDeleteInput, { user, tracing });
  }
}
