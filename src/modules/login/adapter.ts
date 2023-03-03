import { LoginInput, LoginOutput } from './types';

export abstract class ILoginAdapter {
  abstract execute(input: LoginInput): Promise<LoginOutput>;
}
