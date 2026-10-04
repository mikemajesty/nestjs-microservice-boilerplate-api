/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/authorization.guard.md
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { PERMISSION_GUARD } from '@/utils/decorators'
import { ApiForbiddenException } from '@/utils/exception'
import { DefaultErrorMessage } from '@/utils/http-status'
import { Namespaces, NamespacesKeys } from '@/utils/namespaces'
import { ObjectUtils } from '@/utils/object'

import { FastifyRequest, finishTracing } from './utils'

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: IUserRepository,
    private readonly cacheAside: ICacheAsideAdapter,
    private readonly roleRepository: IRoleRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_GUARD, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredPermission) {
      return true
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const userId = ObjectUtils.reach(request, (o) => o.user.id)

    if (!userId) {
      finishTracing(request, ApiForbiddenException.STATUS, 'accessRevoked')
      throw new ApiForbiddenException('accessRevoked')
    }

    const permissions = await this.getPermissions(userId)

    if (!permissions || permissions.size === 0) {
      finishTracing(request, ApiForbiddenException.STATUS, 'accessRevoked')
      throw new ApiForbiddenException('accessRevoked')
    }

    const hasPermission = permissions.has(requiredPermission)

    if (!hasPermission) {
      const appContext = `${context.getClass().name}/${context.getHandler().name}`
      const permission = this.reflector.get(PERMISSION_GUARD, context.getHandler())
      finishTracing(request, ApiForbiddenException.STATUS, ApiForbiddenException.name)
      throw new ApiForbiddenException(DefaultErrorMessage[ApiForbiddenException.STATUS], {
        context: appContext,
        parameters: { permission }
      })
    }

    return true
  }

  private async getPermissions(userId: string): Promise<Set<string>> {
    const user = await this.cacheAside.readThrough(
      Namespaces.userById(userId),
      async () => {
        const u = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true })
        if (!u) return null
        return { id: u.id, roleIds: u.roles.map((r) => r.id) }
      },
      { ttlSeconds: 300, nullTtlSeconds: 30 }
    )

    if (!user) {
      throw new ApiForbiddenException('accessRevoked')
    }

    const roleKeys = user.roleIds.map((id) => Namespaces.roleById(id))
    const permissions = await this.cacheAside.readThroughMany(
      roleKeys,
      async (missingKeys) => {
        const ids = missingKeys.map((k) => k.replace(NamespacesKeys.roleById, ''))
        const found = await this.roleRepository.findIn({ id: ids })

        return new Map(
          found.map((r) => [
            `${NamespacesKeys.roleById}${r.id}`,
            { id: r.id, permissions: r.permissions.map((p) => p.name) }
          ])
        )
      },
      { ttlSeconds: 600 }
    )

    const mapPermissions = new Set<string>()
    for (const role of permissions) {
      if (!role) continue
      for (const p of role.permissions) mapPermissions.add(p)
    }
    return mapPermissions
  }
}
