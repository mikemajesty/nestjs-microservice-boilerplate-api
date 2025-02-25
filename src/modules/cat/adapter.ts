import { CatCreateInput, CatCreateOutput } from '@/core/cat/use-cases/cat-create';
import { CatDeleteInput, CatDeleteOutput } from '@/core/cat/use-cases/cat-delete';
import { CatGetByIdInput, CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id';
import { CatListInput, CatListOutput } from '@/core/cat/use-cases/cat-list';
import { CatUpdateInput, CatUpdateOutput } from '@/core/cat/use-cases/cat-update';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(input: CatCreateInput, trace: ApiTrancingInput): Promise<CatCreateOutput>;
}

export abstract class ICatUpdateAdapter implements IUsecase {
  abstract execute(input: CatUpdateInput, trace: ApiTrancingInput): Promise<CatUpdateOutput>;
}

export abstract class ICatGetByIdAdapter implements IUsecase {
  abstract execute(input: CatGetByIdInput): Promise<CatGetByIdOutput>;
}

export abstract class ICatListAdapter implements IUsecase {
  abstract execute(input: CatListInput): Promise<CatListOutput>;
}

export abstract class ICatDeleteAdapter implements IUsecase {
  abstract execute(input: CatDeleteInput, trace: ApiTrancingInput): Promise<CatDeleteOutput>;
}
