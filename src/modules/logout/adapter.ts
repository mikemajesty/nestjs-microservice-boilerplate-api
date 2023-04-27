import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout';

export abstract class ILogoutAdapter {
  abstract execute(input: LogoutInput): Promise<LogoutOutput>;
}
