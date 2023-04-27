import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';

export abstract class ILoginAdapter {
  abstract execute(input: LoginInput): Promise<LoginOutput>;
}
