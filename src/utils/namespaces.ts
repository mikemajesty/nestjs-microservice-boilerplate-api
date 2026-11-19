/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/namespaces.md
 */
export const NamespacesKeys = {
  roleById: 'role:id:',
  userById: 'user:id:',
  session: 'auth:session:'
}

export const Namespaces = {
  session: (userId: string, sessionId: string) => `${NamespacesKeys.session}${userId.trim()}:${sessionId.trim()}`,
  sessionsOf: (userId: string) => `${NamespacesKeys.session}${userId.trim()}:*`,
  userById: (userId: string) => `${NamespacesKeys.userById}${userId.trim()}`,
  roleById: (roleId: string) => `${NamespacesKeys.roleById}${roleId.trim()}`
}
