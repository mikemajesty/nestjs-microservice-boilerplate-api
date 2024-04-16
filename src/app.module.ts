import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RolesGuardInterceptor } from '@/common/interceptors';
import { InfraModule } from '@/infra/module';
import { TokenModule } from '@/libs/auth';
import { CatsModule } from '@/modules/cats/module';
import { HealthModule } from '@/modules/health/module';
import { LoginModule } from '@/modules/login/module';
import { LogoutModule } from '@/modules/logout/module';
import { UserModule } from '@/modules/user/module';

import { CryptoLibModule } from './libs/crypto';
import { I18nLibModule } from './libs/i18n';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuardInterceptor
    }
  ],
  imports: [
    InfraModule,
    HealthModule,
    UserModule,
    LoginModule,
    LogoutModule,
    TokenModule,
    CatsModule,
    CryptoLibModule,
    I18nLibModule
  ]
})
export class AppModule {}
