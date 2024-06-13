import { PermissionRequest } from '@/utils/docs/data/permission/request';
import { PermissionResponse } from '@/utils/docs/data/permission/response';
import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.create,
      description: 'permission created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.update,
      description: 'permission updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/permissions',
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
      route: 'api/v1/permissions/:id',
      message: 'permissionNotFound',
      description: 'permission not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: PermissionResponse.delete,
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
      json: PermissionResponse.list,
      description: 'permission created.'
    })
  }
};

export const SwaggerRequest = {
  createBody: Swagger.defaultRequestJSON(PermissionRequest.create),
  updateBody: Swagger.defaultRequestJSON(PermissionRequest.update),
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
  }
};
