import { RoleRequest } from '@/utils/docs/data/role/request';
import { RoleResponse } from '@/utils/docs/data/role/response';
import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.create,
      description: 'role created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.update,
      description: 'role updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/roles',
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.getById,
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
      json: RoleResponse.delete,
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
      json: RoleResponse.list,
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
  createBody: Swagger.defaultRequestJSON(RoleRequest.create),
  updateBody: Swagger.defaultRequestJSON(RoleRequest.update),
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
  addPermissions: Swagger.defaultRequestJSON(RoleRequest.addPermission),
  deletePermissions: Swagger.defaultRequestJSON(RoleRequest.deletePermission)
};
