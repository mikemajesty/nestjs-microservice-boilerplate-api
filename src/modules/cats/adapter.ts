import { CatsCreateInput, CatsCreateOutput } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteInput, CatsDeleteOutput } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdInput, CatsGetByIdOutput } from '@/core/cats/use-cases/cats-get-by-id';
import { CatsListInput, CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateInput, CatsUpdateOutput } from '@/core/cats/use-cases/cats-update';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

export abstract class ICatsCreateAdapter implements IUsecase {
  abstract execute(input: CatsCreateInput, trace: ApiTrancingInput): Promise<CatsCreateOutput>;
}

export abstract class ICatsUpdateAdapter implements IUsecase {
  abstract execute(input: CatsUpdateInput, trace: ApiTrancingInput): Promise<CatsUpdateOutput>;
}

export abstract class ICatsGetByIdAdapter implements IUsecase {
  abstract execute(input: CatsGetByIdInput): Promise<CatsGetByIdOutput>;
}

export abstract class ICatsListAdapter implements IUsecase {
  abstract execute(input: CatsListInput): Promise<CatsListOutput>;
}

export abstract class ICatsDeleteAdapter implements IUsecase {
  abstract execute(input: CatsDeleteInput, trace: ApiTrancingInput): Promise<CatsDeleteOutput>;
}
