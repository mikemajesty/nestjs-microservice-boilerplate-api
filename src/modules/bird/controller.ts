import { Controller, Delete, Get, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BirdCreateInput, BirdCreateOutput } from '@/core/bird/use-cases/bird-create';
import { BirdDeleteInput, BirdDeleteOutput } from '@/core/bird/use-cases/bird-delete';
import { BirdGetByIDInput, BirdGetByIDOutput } from '@/core/bird/use-cases/bird-getByID';
import { BirdListInput, BirdListOutput } from '@/core/bird/use-cases/bird-list';
import { BirdUpdateInput, BirdUpdateOutput } from '@/core/bird/use-cases/bird-update';
import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';
import { ApiRequest } from '@/utils/request';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IBirdCreateAdapter,
  IBirdDeleteAdapter,
  IBirdGetByIDAdapter,
  IBirdListAdapter,
  IBirdUpdateAdapter
} from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';

@Controller()
@ApiTags('bird')
@ApiBearerAuth()
@Roles(UserRole.BACKOFFICE)
export class BirdController {
  constructor(
    private readonly birdCreateUsecase: IBirdCreateAdapter,
    private readonly birdUpdateUsecase: IBirdUpdateAdapter,
    private readonly birdDeleteUsecase: IBirdDeleteAdapter,
    private readonly birdListUsecase: IBirdListAdapter,
    private readonly birdGetByIDUsecase: IBirdGetByIDAdapter
  ) {}

  @Post('/birds')
  @ApiResponse(SwagggerResponse.create[200])
  @ApiBody(SwagggerRequest.createBody)
  async create(@Req() { body }: ApiRequest): BirdCreateOutput {
    return this.birdCreateUsecase.execute(body as BirdCreateInput);
  }

  @Put('/birds')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Req() { body }: ApiRequest): BirdUpdateOutput {
    return this.birdUpdateUsecase.execute(body as BirdUpdateInput);
  }

  @Get('/birds')
  @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwagggerRequest.listQuery.pagination.page)
  @ApiQuery(SwagggerRequest.listQuery.sort)
  @ApiQuery(SwagggerRequest.listQuery.search)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Req() { query }: ApiRequest): BirdListOutput {
    const input: BirdListInput = {
      sort: SortHttpSchema.parse(query.sort),
      search: SearchHttpSchema.parse(query.search),
      limit: Number(query.limit),
      page: Number(query.page)
    };

    return await this.birdListUsecase.execute(input);
  }

  @Get('/birds/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Req() { params }: ApiRequest): BirdGetByIDOutput {
    return await this.birdGetByIDUsecase.execute(params as BirdGetByIDInput);
  }

  @Delete('/birds/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Req() { params }: ApiRequest): BirdDeleteOutput {
    return await this.birdDeleteUsecase.execute(params as BirdDeleteInput);
  }
}
