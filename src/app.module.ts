import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { InfraModule } from './infra/module';
import { LibsModule } from './libs/module';
import { HealthModule } from './modules/health/module';
import { LoginModule } from './modules/login/module';
import { UserModule } from './modules/user/module';
import { RolesGuardInterceptor } from './utils/interceptors/auth-guard.interceptor';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuardInterceptor
    }
  ],
  imports: [InfraModule, HealthModule, UserModule, LoginModule, LibsModule]
})
export class AppModule {}
