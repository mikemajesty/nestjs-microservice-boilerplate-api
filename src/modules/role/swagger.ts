import { RoleRequest } from '@/utils/docs/data/role/request';
import { RoleResponse } from '@/utils/docs/data/role/response';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = 'api/v1/roles';

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.create,
      description: 'create role.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.update,
      description: 'update role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.getById,
      description: 'get role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.delete,
      description: 'delete role.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: RoleResponse.list,
      description: 'list role.'
    })
  },
  removePermissions: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'remove permission from role'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/remove-permissions/:id`,
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
      route: `${BASE_URL}/add-permissions/:id`,
      message: 'roleNotFound',
      description: 'role not found.'
    })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON(RoleRequest.create),
  update: Swagger.defaultRequestJSON(RoleRequest.update),
  list: Swagger.defaultRequestListJSON(),
  addPermission: Swagger.defaultRequestJSON(RoleRequest.addPermission),
  deletePermission: Swagger.defaultRequestJSON(RoleRequest.deletePermission)
};
