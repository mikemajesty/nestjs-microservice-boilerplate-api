import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { RefreshTokenInput, RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

export abstract class ILoginAdapter implements IUsecase {
  abstract execute(input: LoginInput, trace: ApiTrancingInput): Promise<LoginOutput>;
}

export abstract class IRefreshTokenAdapter implements IUsecase {
  abstract execute(input: RefreshTokenInput): Promise<RefreshTokenOutput>;
}
