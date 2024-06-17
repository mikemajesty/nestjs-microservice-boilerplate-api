import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { InfraModule } from '@/infra/module';
import { HealthModule } from '@/modules/health/module';
import { LoginModule } from '@/modules/login/module';
import { UserModule } from '@/modules/user/module';
import { AuthRoleGuard } from '@/observables/guards';

import { IRoleRepository } from './core/role/repository/role';
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
    ResetPasswordModule,
    RoleModule,
    PermissionModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (repository: IRoleRepository) => {
        return new AuthRoleGuard(new Reflector(), repository);
      },
      inject: [IRoleRepository]
    }
  ]
})
export class AppModule {}
