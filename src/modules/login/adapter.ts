import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { ApiTrancingInput } from '@/utils/request';

export abstract class ILoginAdapter {
  abstract execute(input: LoginInput, trace: ApiTrancingInput): Promise<LoginOutput>;
}
