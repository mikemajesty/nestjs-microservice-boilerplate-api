import { UserRole } from '@/core/user/entity/user';
import { CreatedModel } from '@/infra/repository';
import { Swagger } from '@/utils/swagger';

const entity = {
  id: '<id>',
  clientId: '<clientId>',
  clientSecret: '<clientSecret>',
  organization: '<organization>',
  roles: [UserRole.USER]
};

const entityFull = { ...entity, deletedAt: '<deletedAt>', createdAt: '<createdAt>', updatedAt: '<updatedAt>' };

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { created: true, id: '<uuid>' } as CreatedModel,
      description: 'user created.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: 'api/users',
      message: 'userExists',
      description: 'user exists.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'user updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users',
      message: 'userNotFound',
      description: 'user not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: 'api/users',
      message: 'userExists',
      description: 'user exists.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users/:id',
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users/:id',
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { docs: { docs: [entityFull], page: 1, limit: 1, total: 1 } },
      description: 'user created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON({ ...entity, id: undefined }),
  updateBody: Swagger.defaultRequestJSON({ ...entity, id: '<id>' }),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({ example: 'createdAt:desc', name: 'sort', required: false })
  }
};
