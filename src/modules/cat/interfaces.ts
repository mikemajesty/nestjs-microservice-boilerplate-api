/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create'
import { CatDeleteInput, CatDeleteOutput } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdInput, CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list'
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class ICatCreate implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTracingInput): Promise<CatCreateOutput>
}

export abstract class ICatUpdate implements IUsecase {
  abstract execute(input: CatUpdateInput, trace: ApiTracingInput): Promise<CatUpdateOutput>
}

export abstract class ICatGetById implements IUsecase {
  abstract execute(input: CatGetByIdInput): Promise<CatGetByIdOutput>
}

export abstract class ICatList implements IUsecase {
  abstract execute(input: CatListInput): Promise<CatListOutput>
}

export abstract class ICatDelete implements IUsecase {
  abstract execute(input: CatDeleteInput, trace: ApiTracingInput): Promise<CatDeleteOutput>
}
