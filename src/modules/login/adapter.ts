import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

export abstract class ILoginAdapter implements IUsecase {
  abstract execute(input: LoginInput, trace: ApiTrancingInput): Promise<LoginOutput>;
}
