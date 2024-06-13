import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { RoleAddPermissionInput } from '@/core/role/use-cases/role-add-permission';
import { RoleCreateOutput } from '@/core/role/use-cases/role-create';
import { RoleDeleteOutput } from '@/core/role/use-cases/role-delete';
import { RoleGetByIDOutput } from '@/core/role/use-cases/role-get-by-id';
import { RoleListOutput } from '@/core/role/use-cases/role-list';
import { RoleUpdateOutput } from '@/core/role/use-cases/role-update';
import { Swagger } from '@/utils/docs/swagger';

const input = new RoleEntity({
  name: RoleEnum.USER
});

const output = new RoleEntity({
  ...input,
  updatedAt: new Date(),
  createdAt: new Date(),
  deletedAt: null,
  permissions: []
});

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { created: true, id: '<uuid>' } as RoleCreateOutput,
      description: 'role created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as RoleUpdateOutput,
      description: 'role updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as RoleGetByIDOutput,
      description: 'role found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles/:id',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: output as RoleDeleteOutput,
      description: 'role found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles/:id',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { docs: [output], page: 1, limit: 1, total: 1 } as RoleListOutput,
      description: 'role created.'
    })
  },
  removePermissions: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'remove permission from role'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles/remove-permissions/:id',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  addPermissions: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'add permission to role'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles/add-permissions/:id',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  }
};

export const SwaggerRequest = {
  createBody: Swagger.defaultRequestJSON({ ...input, id: undefined } as RoleEntity),
  updateBody: Swagger.defaultRequestJSON({ name: input.name } as RoleEntity),
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
      description: '<b>propertyName:propertyValue'
    })
  },
  addPermissions: Swagger.defaultRequestJSON({ permissions: ['user:list', 'user:create'] } as RoleAddPermissionInput),
  deletePermissions: Swagger.defaultRequestJSON({ permissions: ['user:list', 'user:create'] } as RoleAddPermissionInput)
};
