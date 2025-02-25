import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/exceptions.tsp";
import "../../utils/versioning.tsp";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using api.Utils.Model;
using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Versioning;
using Utils.Exception;

@service({
  title: "Role",
})
namespace api.Role;

@tag("Role")
@route("/api/{version}/roles")
@useAuth(BearerAuth)
interface RoleController {
  @post
  @doc("create role")
  @returnsDoc("role created successfully")
  create(...VersionParams, @body body: CreateInput): DefaultSuccessResponse<
    CreateOutput,
    201
  > | CreateValidationException;

  @put
  @doc("create role")
  @returnsDoc("role created successfully")
  update(...VersionParams, ...UpdateParamsInput, @body body: UpdateInput): DefaultSuccessResponse<
    UpdateOutput,
    200
  > | UpdateParamsValidationError | UpdateNotFoundException;

  @get
  @doc("get role by id")
  @returnsDoc("role found successfully")
  getById(...VersionParams, ...GetByIdParamsInput): DefaultSuccessResponse<
    GetByIdOutput,
    200
  > | GetByIdValidationException | GetByIdNotFoundException;

  @get
  @doc("list role")
  @returnsDoc("list role successfully")
  list(...VersionParams, ...ListQueryInput): DefaultSuccessResponse<ListOutput, 200>;

  @delete
  @doc("delete role")
  @returnsDoc("role deleted successfully")
  delete(...VersionParams, ...DeleteParamsInput): DefaultSuccessResponse<
    DeleteOutput,
    200
  > | DeleteConflictException | DeleteNotFoundException;

  @put
  @route("/add-permissions")
  @doc("add permission from role")
  @returnsDoc("permission added successfully")
  addPermission(...VersionParams, ...AddPermissionParamsInput, @body body: AddPermissionInput): DefaultSuccessResponse<
    AddPermissionOutput,
    200
  > | AddPermissionNotFoundException;

  @put
  @route("/remove-permissions")
  @doc("remove permission from role")
  @returnsDoc("permission removed successfully")
  removePermission(
    ...VersionParams,
    ...RemovePermissionParamsInput,
    @body body: RemovePermissionInput,
  ): DefaultSuccessResponse<RemovePermissionOuput, 200> | RemovePermissionNotFoundException;
}
