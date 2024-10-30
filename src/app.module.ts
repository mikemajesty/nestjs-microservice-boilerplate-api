import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { InfraModule } from '@/infra/module';
import { CatModule } from '@/modules/cat/module';
import { HealthModule } from '@/modules/health/module';
import { LoginModule } from '@/modules/login/module';
import { LogoutModule } from '@/modules/logout/module';
import { UserModule } from '@/modules/user/module';
import { AuthRoleGuard } from '@/observables/guards';

import { IUserRepository } from './core/user/repository/user';
import { LibModule } from './libs/module';
import { PermissionModule } from './modules/permission/module';
import { ResetPasswordModule } from './modules/reset-password/module';
import { RoleModule } from './modules/role/module';

@Module({
  imports: [
    InfraModule,
    LibModule,
    HealthModule,
    UserModule,
    LoginModule,
    LogoutModule,
    CatModule,
    ResetPasswordModule,
    RoleModule,
    PermissionModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (repository: IUserRepository) => {
        return new AuthRoleGuard(new Reflector(), repository);
      },
      inject: [IUserRepository]
    }
  ]
})
export class AppModule {}
