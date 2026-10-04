import { Injectable, RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA, VERSION_METADATA } from '@nestjs/common/constants'
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core'

import { PERMISSION_GUARD } from '@/utils/decorators'

@Injectable()
export class RoutesExplorer {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  extractRoutes(): RouteInfo[] {
    const routes: RouteInfo[] = []

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper
      if (!instance || !metatype) continue

      const controllerPath = this.reflector.get<string>(PATH_METADATA, metatype) ?? ''

      const controllerVersion = this.reflector.get<string | string[]>(VERSION_METADATA, metatype) ?? undefined

      const prototype = Object.getPrototypeOf(instance)

      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = instance[methodName]
        if (typeof handler !== 'function') continue

        const httpMethodCode = this.reflector.get<number>(METHOD_METADATA, handler)

        if (httpMethodCode === undefined) continue

        const methodPath = this.reflector.get<string>(PATH_METADATA, handler) ?? ''

        const methodVersion = this.reflector.get<string | string[]>(VERSION_METADATA, handler) ?? controllerVersion

        const permission = this.reflector.get<string>(PERMISSION_GUARD, handler) ?? null

        if (permission === null) continue

        routes.push({
          controller: metatype.name,
          method: methodName,
          httpMethod: RequestMethod[httpMethodCode],
          path: this.joinPaths(controllerPath, methodPath),
          version: this.normalizeVersion(methodVersion),
          permission
        })
      }
    }

    return routes
  }

  private joinPaths(...parts: string[]): string {
    return (
      '/' +
      parts
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '')
    )
  }

  private normalizeVersion(v?: string | string[]): string | undefined {
    if (v === undefined) return undefined
    return Array.isArray(v) ? v.join(',') : String(v)
  }
}

export type RouteInfo = {
  controller: string
  method: string
  httpMethod: string
  path: string
  version?: string
  permission: string
}
