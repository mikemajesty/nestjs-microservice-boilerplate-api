import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import fs from 'fs';
import handlebars from 'handlebars';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import path from 'path';

import { EventNameEnum } from '@/libs/event/types';

import { ILoggerAdapter } from '../logger';
import { ISecretsAdapter } from '../secrets';
import { IEmailAdapter } from './adapter';

export type SendEmailInput = {
  subject: string;
  email: string;
  template: string;
  payload: object;
};

export type SendEmailOutput = SMTPTransport.SentMessageInfo;

@Injectable()
export class EmailService implements IEmailAdapter {
  constructor(
    private readonly secrets: ISecretsAdapter,
    private readonly logger: ILoggerAdapter,
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>
  ) {}

  async send(input: SendEmailInput): Promise<SendEmailOutput> {
    /* eslint-disable-next-line security/detect-non-literal-fs-filename */
    const source = fs.readFileSync(path.join(__dirname, `/templates/${input.template}.handlebars`), 'utf8');
    const compiledTemplate = handlebars.compile(source);
    const options = () => {
      return {
        from: this.secrets.EMAIL.FROM,
        to: input.email,
        subject: input.subject,
        html: compiledTemplate(input.payload)
      };
    };

    return new Promise((res, rej) => {
      this.transporter.sendMail(options(), (error, info) => {
        if (error) {
          return rej(error);
        }

        return res(info);
      });
    });
  }

  @OnEvent(EventNameEnum.SEND_EMAIL)
  async handleSendEmailEvent(payload: SendEmailInput) {
    await this.send(payload);
    this.logger.info({ message: 'email sended successfully.' });
  }
}
