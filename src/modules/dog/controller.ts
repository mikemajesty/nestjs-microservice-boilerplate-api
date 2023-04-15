import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';
import { SearchHttpSchema } from '@/utils/search';
import { SortHttpSchema } from '@/utils/sort';

import {
  IDogCreateAdapter,
  IDogDeleteAdapter,
  IDogGetByIDAdapter,
  IDogListAdapter,
  IDogUpdateAdapter
} from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';
import {
  DogCreateInput,
  DogCreateOutput,
  DogDeleteInput,
  DogDeleteOutput,
  DogGetByIDInput,
  DogGetByIDOutput,
  DogListInput,
  DogListOutput,
  DogUpdateInput,
  DogUpdateOutput
} from './types';

@Controller()
@ApiTags('dog')
@ApiBearerAuth()
@Roles(UserRole.BACKOFFICE)
export class DogController {
  constructor(
    private readonly dogCreate: IDogCreateAdapter,
    private readonly dogUpdate: IDogUpdateAdapter,
    private readonly dogGetByID: IDogGetByIDAdapter,
    private readonly dogList: IDogListAdapter,
    private readonly dogDelete: IDogDeleteAdapter
  ) {}

  @Post('/dogs')
  @ApiResponse(SwagggerResponse.create[200])
  @ApiBody(SwagggerRequest.createBody)
  async create(@Body() input: DogCreateInput): DogCreateOutput {
    return await this.dogCreate.execute(input);
  }

  @Put('/dogs')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Body() input: DogUpdateInput): DogUpdateOutput {
    return await this.dogUpdate.execute(input);
  }

  @Get('/dogs/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Param() input: DogGetByIDInput): DogGetByIDOutput {
    return await this.dogGetByID.execute(input);
  }

  @Get('/dogs')
  @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
  @ApiQuery(SwagggerRequest.listQuery.pagination.page)
  @ApiQuery(SwagggerRequest.listQuery.sort)
  @ApiQuery(SwagggerRequest.listQuery.search)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Query() input: DogListInput): DogListOutput {
    input.sort = SortHttpSchema.parse(input.sort);
    input.search = SearchHttpSchema.parse(input.search);
    return await this.dogList.execute(input);
  }

  @Delete('/dogs/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Param() input: DogDeleteInput): DogDeleteOutput {
    return await this.dogDelete.execute(input);
  }
}
