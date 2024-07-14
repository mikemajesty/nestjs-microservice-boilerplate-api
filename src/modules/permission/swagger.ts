import { PermissionRequest } from '@/utils/docs/data/permission/request';
import { PermissionResponse } from '@/utils/docs/data/permission/response';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = 'api/v1/permissions';

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.create,
      description: 'create permission.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
      message: 'permissionExists',
      description: 'permission exists.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.update,
      description: 'update permission.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.getById,
      description: 'permission found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.delete,
      description: 'delete permission.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.list,
      description: 'list permission.'
    })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON(PermissionRequest.create),
  update: Swagger.defaultRequestJSON(PermissionRequest.update),
  list: Swagger.defaultRequestListJSON()
};
