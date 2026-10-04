/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/namespaces.md
 */
export const NamespacesKeys = {
  roleById: 'role:id:',
  userById: 'user:id:',
  blacklist: 'auth:blacklist:'
}

export const Namespaces = {
  blacklist: (userId: string) => `${NamespacesKeys.blacklist}${userId.trim()}`,
  userById: (userId: string) => `${NamespacesKeys.userById}${userId.trim()}`,
  roleById: (roleId: string) => `${NamespacesKeys.roleById}${roleId.trim()}`
}
