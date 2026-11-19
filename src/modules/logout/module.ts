/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'

import { LogoutUsecase } from '@/core/user/use-cases/user-logout'
import { ISessionAdapter, SessionLibModule } from '@/libs/session'

import { LogoutController } from './controller'
import { ILogout } from './interfaces'

@Module({
  imports: [SessionLibModule],
  controllers: [LogoutController],
  providers: [
    {
      provide: ILogout,
      useFactory: (session: ISessionAdapter) => {
        return new LogoutUsecase(session)
      },
      inject: [ISessionAdapter]
    }
  ],
  exports: [ILogout]
})
export class LogoutModule {}
