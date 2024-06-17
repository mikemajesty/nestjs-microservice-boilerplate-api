import { SendEmailInput, SendEmailOutput } from './service';

export abstract class IEmailAdapter {
  abstract send(input: SendEmailInput): Promise<SendEmailOutput>;
}
