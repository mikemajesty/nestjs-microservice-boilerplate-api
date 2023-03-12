import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  ICatsCreateAdapter,
  ICatsDeleteAdapter,
  ICatsGetByIDAdapter,
  ICatsListAdapter,
  ICatsUpdateAdapter
} from './adaptet';
import { SwagggerRequest, SwagggerResponse } from './swagger';
import {
  CatsCreateInput,
  CatsCreateOutput,
  CatsDeleteInput,
  CatsDeleteOutput,
  CatsGetByIDInput,
  CatsGetByIDOutput,
  CatsListInput,
  CatsListOutput,
  CatsUpdateInput,
  CatsUpdateOutput
} from './types';

@Controller()
@ApiTags('cats')
@ApiBearerAuth()
@Roles(UserRole.USER)
export class CatsController {
  constructor(
    private readonly catsCreate: ICatsCreateAdapter,
    private readonly catsUpdate: ICatsUpdateAdapter,
    private readonly catsGetByID: ICatsGetByIDAdapter,
    private readonly catsList: ICatsListAdapter,
    private readonly catsDelete: ICatsDeleteAdapter
  ) {}

  @Post('/cats')
  @ApiResponse(SwagggerResponse.create[200])
  @ApiBody(SwagggerRequest.createBody)
  async create(@Body() input: CatsCreateInput): CatsCreateOutput {
    return await this.catsCreate.execute(input);
  }

  @Put('/cats')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Body() input: CatsUpdateInput): CatsUpdateOutput {
    return await this.catsUpdate.execute(input);
  }

  @Get('/cats/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Param() input: CatsGetByIDInput): CatsGetByIDOutput {
    return await this.catsGetByID.execute(input);
  }

  @Get('/cats')
  @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwagggerRequest.listQuery.pagination.page)
  @ApiQuery(SwagggerRequest.listQuery.sort)
  @ApiQuery(SwagggerRequest.listQuery.search)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Query() input: CatsListInput): CatsListOutput {
    input.sort = SortHttpSchema.parse(input.sort);
    input.search = SearchHttpSchema.parse(input.search);
    return await this.catsList.execute(input);
  }

  @Delete('/cats/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Param() input: CatsDeleteInput): CatsDeleteOutput {
    return await this.catsDelete.execute(input);
  }
}
