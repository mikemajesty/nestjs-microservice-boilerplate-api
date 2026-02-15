import { PermissionFixture } from './permission'
import { RoleFixture } from './role'
import { UserFixture } from './user'

export class FixtureUtils {
  static addBaseSeeds = (permissionFixture: PermissionFixture, roleFixture: RoleFixture, userFixture: UserFixture) => {
    const permissions = permissionFixture.entity

    for (const role of roleFixture.entity) {
      roleFixture.addPermissions(role, permissions)
    }

    const roles = roleFixture.entity

    userFixture.entity.roles = roles
  }
}
