import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { TokenModule } from '@/libs/auth';

import { SequelizeDatabaseModule } from './infra/database/sequelize';
import { InfraModule } from './infra/module';
import { CatsModule } from './modules/cats/module';
import { HealthModule } from './modules/health/module';
import { LoginModule } from './modules/login/module';
import { LogoutModule } from './modules/logout/module';
import { UserModule } from './modules/user/module';
import { RolesGuardInterceptor } from './utils/interceptors/auth-guard.interceptor';

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
    SequelizeDatabaseModule
  ]
})
export class AppModule {}
