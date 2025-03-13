import { PermissionEntity } from '@/core/permission/entity/permission';
import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';
import { InputValidator } from '@/utils/validator';

import { IPermissionRepository } from '../repository/permission';

export const PermissionListSchema = InputValidator.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export class PermissionListUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionListSchema)
  async execute(input: PermissionListInput): Promise<PermissionListOutput> {
    return await this.permissionRepository.paginate(input);
  }
}

export type PermissionListInput = PaginationInput<PermissionEntity>;
export type PermissionListOutput = PaginationOutput<PermissionEntity>;
