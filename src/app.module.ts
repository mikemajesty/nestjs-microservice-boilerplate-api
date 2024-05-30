import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RolesGuardInterceptor } from '@/common/interceptors';
import { InfraModule } from '@/infra/module';
import { CatsModule } from '@/modules/cats/module';
import { HealthModule } from '@/modules/health/module';
import { LoginModule } from '@/modules/login/module';
import { LogoutModule } from '@/modules/logout/module';
import { UserModule } from '@/modules/user/module';

import { LibModule } from './libs/module';
import { ResetPasswordModule } from './modules/reset-password/module';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuardInterceptor
    }
  ],
  imports: [
    InfraModule,
    LibModule,
    HealthModule,
    UserModule,
    LoginModule,
    LogoutModule,
    CatsModule,
    ResetPasswordModule
  ]
})
export class AppModule {}
