import { Module } from '@nestjs/common';

import { IUserRepository } from '@/core/user/repository/user';
import { LoginUsecase } from '@/core/user/use-cases/user-login';
import { ITokenAdapter, TokenModule } from '@/libs/auth';
import { CryptoLibModule, ICryptoAdapter } from '@/libs/crypto';

import { UserModule } from '../user/module';
import { ILoginAdapter } from './adapter';
import { LoginController } from './controller';

@Module({
  imports: [TokenModule, UserModule, CryptoLibModule],
  controllers: [LoginController],
  providers: [
    {
      provide: ILoginAdapter,
      useFactory: (repository: IUserRepository, tokenService: ITokenAdapter, crypto: ICryptoAdapter) => {
        return new LoginUsecase(repository, tokenService, crypto);
      },
      inject: [IUserRepository, ITokenAdapter, ICryptoAdapter]
    }
  ]
})
export class LoginModule {}
