import { LogoutInput, LogoutOutput } from './types';

export abstract class ILogoutAdapter {
  abstract execute(input: LogoutInput): Promise<LogoutOutput>;
}
