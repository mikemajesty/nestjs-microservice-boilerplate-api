## Trancing usage

- Import the HTTP adapter in usecase adapter.

  ```
  import { IHttpAdapter } from '@/infra/http';
  import { UserCreateInput, UserCreateOutput } from './types';

  export abstract class IUserCreateAdapter {
    abstract execute(input: UserCreateInput, httpService: IHttpAdapter): Promise<UserCreateOutput>;
  }
  ```

- Get HTTP tracing and send it to the usecase adapter.

  ```
  import { Controller, Post, Req } from '@nestjs/common';
  import { ApiRequest } from '@/utils/request';
  import { IUserCreateAdapter } from './adapter';
  import { UserListOutput } from './types';

  @Controller()
  export class UserController {
    constructor(private readonly userCreate: IUserCreateAdapter) {}

    @Post('/users')
    async list(@Req() { tracing, body }: ApiRequest): UserListOutput {
      return await this.userCreate.execute(body, { instance: tracing.axios, tracing });
    }
  }
  ```

- Call the instance HTTP.

  ```
  # internal
  async execute(input: UserListInput, httpService: IHttpAdapter): Promise<UserListOutput> {
    const http = httpService.instance();

    await http.post('http://localhost:4000/api/cats', input);
  }
  ```

  ```
  # external
  async execute(input: UserListInput, httpService: IHttpAdapter): Promise<UserListOutput> {
    const http = httpService.instance();
    const externalSpan = httpService.tracing.createSpan('google');
    try {
       externalSpan.setTag(httpService.tracing.tags.PEER_SERVICE, 'www.google.com.br');
       externalSpan.setTag(httpService.tracing.tags.SPAN_KIND, 'client');
       externalSpan.setTag(httpService.tracing.tags.PEER_HOSTNAME, 'https://www.google.com.br');
       await http.get('https://www.google.com.br');
       externalSpan.finish();
    } catch (error) {
       externalSpan.setTag(httpService.tracing.tags.ERROR, true);
       externalSpan.setTag('message', error.response.message || error.message);
       externalSpan.setTag('statusCode', error.response.status || error.status);
       externalSpan.finish();
       throw error
    }
  }
  ```

- Access Jaeger URL
  ```
  http://localhost:16686/search
  ```
