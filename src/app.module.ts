import { Module } from '@nestjs/common'

import { InfraModule } from '@/infra/module'
import { CatModule } from '@/modules/cat/module'
import { HealthModule } from '@/modules/health/module'
import { LoginModule } from '@/modules/login/module'
import { LogoutModule } from '@/modules/logout/module'
import { UserModule } from '@/modules/user/module'

import { LibModule } from './libs/module'
import { GuardsModule } from './middlewares/guards'
import { InterceptorsModule } from './middlewares/interceptors'
import { AlertModule } from './modules/alert/module'
import { PermissionModule } from './modules/permission/module'
import { ResetPasswordModule } from './modules/reset-password/module'
import { RoleModule } from './modules/role/module'

@Module({
  imports: [
    InfraModule,
    LibModule,
    HealthModule,
    AlertModule,
    UserModule,
    LoginModule,
    LogoutModule,
    CatModule,
    ResetPasswordModule,
    RoleModule,
    PermissionModule,
    GuardsModule,
    InterceptorsModule
  ]
})
export class AppModule {}
