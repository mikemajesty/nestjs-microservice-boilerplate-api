import { EmailGetInput, EmailGetOutput } from './service';

export abstract class IEmailAdapter {
  abstract send(input: EmailGetInput): Promise<EmailGetOutput>;
}
