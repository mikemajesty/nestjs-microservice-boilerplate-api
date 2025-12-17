/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/infra/email.md
 */
import { SendEmailInput, SendEmailOutput } from './service';

export abstract class IEmailAdapter {
  abstract send(input: SendEmailInput): Promise<SendEmailOutput>
}
