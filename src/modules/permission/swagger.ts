import { PermissionEntity } from '@/core/permission/entity/permission';
import { PermissionCreateOutput } from '@/core/permission/use-cases/permission-create';
import { PermissionDeleteOutput } from '@/core/permission/use-cases/permission-delete';
import { PermissionGetByIDOutput } from '@/core/permission/use-cases/permission-get-by-id';
import { PermissionListOutput } from '@/core/permission/use-cases/permission-list';
import { PermissionUpdateOutput } from '@/core/permission/use-cases/permission-update';
import { Swagger } from '@/utils/docs/swagger';

const input = new PermissionEntity({
  name: 'ALL'
});

const output = new PermissionEntity({ ...input, updatedAt: new Date(), createdAt: new Date(), deletedAt: null });

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { created: true, id: '<uuid>' } as PermissionCreateOutput,
      description: 'permission created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as PermissionUpdateOutput,
      description: 'permission updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/permissions',
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as PermissionGetByIDOutput,
      description: 'permission found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/permissions/:id',
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as PermissionDeleteOutput,
      description: 'permission found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/permissions/:id',
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { docs: [output], page: 1, limit: 1, total: 1 } as PermissionListOutput,
      description: 'permission created.'
    })
  }
};

export const SwaggerRequest = {
  createBody: Swagger.defaultRequestJSON({ ...input, id: undefined } as PermissionEntity),
  updateBody: Swagger.defaultRequestJSON({ ...input, id: '<id>' } as PermissionEntity),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({
      name: 'sort',
      required: false,
      description: '<b>createdAt:desc,name:asc'
    }),
    search: Swagger.defaultApiQueryOptions({
      name: 'search',
      required: false,
      description: '<b>name:miau'
    })
  }
};
