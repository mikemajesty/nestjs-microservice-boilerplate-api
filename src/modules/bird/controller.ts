import { Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common'

import { BirdCreateInput, BirdCreateOutput } from '@/core/bird/use-cases/bird-create'
import { BirdDeleteInput, BirdDeleteOutput } from '@/core/bird/use-cases/bird-delete'
import { BirdGetByIdInput, BirdGetByIdOutput } from '@/core/bird/use-cases/bird-get-by-id'
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list'
import { BirdUpdateInput, BirdUpdateOutput } from '@/core/bird/use-cases/bird-update'
import { ApiRequest } from '@/utils/request'
import { SearchHttpSchema } from '@/utils/search'
import { SortHttpSchema } from '@/utils/sort'

import {
  IBirdCreateAdapter,
  IBirdDeleteAdapter,
  IBirdGetByIdAdapter,
  IBirdListAdapter,
  IBirdUpdateAdapter
} from './adapter'

@Controller('birds')
export class BirdController {
  constructor(
    private readonly createUsecase: IBirdCreateAdapter,
    private readonly updateUsecase: IBirdUpdateAdapter,
    private readonly getByIdUsecase: IBirdGetByIdAdapter,
    private readonly listUsecase: IBirdListAdapter,
    private readonly deleteUsecase: IBirdDeleteAdapter
  ) {}

  @Post()
  @Version('1')
  @HttpCode(201)
  async create(@Req() { body }: ApiRequest): Promise<BirdCreateOutput> {
    return await this.createUsecase.execute(body as BirdCreateInput)
  }

  @Put(':id')
  @Version('1')
  async update(@Req() { body, params }: ApiRequest): Promise<BirdUpdateOutput> {
    return await this.updateUsecase.execute({ ...body, id: params.id } as BirdUpdateInput)
  }

  @Get(':id')
  @Version('1')
  async getById(@Req() { params }: ApiRequest): Promise<BirdGetByIdOutput> {
    return await this.getByIdUsecase.execute(params as BirdGetByIdInput)
  }

  @Get()
  @Version('1')
  async list(@Req() { query }: ApiRequest): Promise<BirdListOutput> {
    const input: BirdListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    }

    return await this.listUsecase.execute(input)
  }

  @Delete(':id')
  @Version('1')
  async delete(@Req() { params }: ApiRequest): Promise<BirdDeleteOutput> {
    return await this.deleteUsecase.execute(params as BirdDeleteInput)
  }
}
