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
      return await this.userCreate.execute(body, { instance: tracing.axios });
    }
  }
  ```
- Call the instance HTTP and magic :).
  ```
  async execute(input: UserListInput, http: IHttpAdapter): Promise<UserListOutput> {
    const catModel = await http.instance().post('http://localhost:4000/api/cats', { name: 'Miau', breed: 'siamese', age: 1 } as CatsEntity, {
        headers: {
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbiI6ImFkbWluIiwicGFzc3dvcmQiOiJhZG1pbiIsInJvbGVzIjpbIkJBQ0tPRkZJQ0UiLCJVU0VSIl0sImlhdCI6MTY4MjIxMTk5NCwiZXhwIjozMDE2ODIyMTE5OTR9.FEg-JfkgYgr-9HDUMnJJCyzoE-qBbaG-MbKz5ijkX0w'
        }
      });
  }
  ```
- Access Jaeger URL
  ```
  http://0.0.0.0:16686/search
  ```
