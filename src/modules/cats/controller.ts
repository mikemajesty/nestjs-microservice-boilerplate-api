import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/core/user/entity/user';
import { Roles } from '@/utils/decorators/role.decorator';

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
  CatsCreateSchema,
  CatsDeleteInput,
  CatsDeleteOutput,
  CatsDeleteSchema,
  CatsGetByIDInput,
  CatsGetByIDOutput,
  CatsGetByIdSchema,
  CatsListInput,
  CatsListOutput,
  CatsListSchema,
  CatsUpdateInput,
  CatsUpdateOutput,
  CatsUpdateSchema
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
    const model = CatsCreateSchema.parse(input);
    return await this.catsCreate.execute(model);
  }

  @Put('/cats')
  @ApiResponse(SwagggerResponse.update[200])
  @ApiResponse(SwagggerResponse.update[404])
  @ApiBody(SwagggerRequest.updateBody)
  async update(@Body() input: CatsUpdateInput): CatsUpdateOutput {
    const model = CatsUpdateSchema.parse(input);
    return await this.catsUpdate.execute(model);
  }

  @Get('/cats/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.getByID[200])
  @ApiResponse(SwagggerResponse.getByID[404])
  async getById(@Param() input: CatsGetByIDInput): CatsGetByIDOutput {
    const model = CatsGetByIdSchema.parse(input);
    return await this.catsGetByID.execute(model);
  }

  @Get('/cats')
  @ApiQuery(SwagggerRequest.listQuery)
  @ApiResponse(SwagggerResponse.list[200])
  async list(@Query() input: CatsListInput): CatsListOutput {
    const model = CatsListSchema.parse(input);
    return await this.catsList.execute(model);
  }

  @Delete('/cats/:id')
  @ApiParam({ name: 'id', required: true })
  @ApiResponse(SwagggerResponse.delete[200])
  @ApiResponse(SwagggerResponse.delete[404])
  async delete(@Param() input: CatsDeleteInput): CatsDeleteOutput {
    const model = CatsDeleteSchema.parse(input);
    return await this.catsDelete.execute(model);
  }
}
