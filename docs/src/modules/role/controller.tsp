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
using Utils.Versions;
using Utils.Exception;

@service({
  title: "Role",
})
namespace api.Role;

@tag("Role")
@route("/api/roles")
interface RoleController {
  @post
  @doc("create role")
  @returnsDoc("role created successfully")
  create(@body body: CreateInput): DefaultSuccessResponse<CreateOutput, 201> | CreateValidationException;

  @put
  @doc("create role")
  @returnsDoc("role created successfully")
  update(...UpdateParamsInput, @body body: UpdateInput): DefaultSuccessResponse<
    UpdateOutput,
    200
  > | UpdateParamsValidationError | UpdateNotFoundException;

  @get
  @doc("get role by id")
  @returnsDoc("role found successfully")
  getById(...GetByIdParamsInput): DefaultSuccessResponse<
    GetByIdOutput,
    200
  > | GetByIdValidationException | GetByIdNotFoundException;

  @get
  @doc("list role")
  @returnsDoc("list role successfully")
  list(...ListQueryInput): DefaultSuccessResponse<ListOutput, 200>;

  @delete
  @doc("delete role")
  @returnsDoc("role deleted successfully")
  delete(...DeleteParamsInput): DefaultSuccessResponse<
    DeleteOutput,
    200
  > | DeleteConflictException | DeleteNotFoundException;

  @put
  @route("/add-permissions")
  @doc("add permission from role")
  @returnsDoc("permission added successfully")
  addPermission(...AddPermissionParamsInput, @body body: AddPermissionInput): DefaultSuccessResponse<
    AddPermissionOutput,
    200
  > | AddPermissionNotFoundException;

  @put
  @route("/remove-permissions")
  @doc("remove permission from role")
  @returnsDoc("permission removed successfully")
  removePermission(...RemovePermissionParamsInput, @body body: RemovePermissionInput): DefaultSuccessResponse<
    RemovePermissionOuput,
    200
  > | RemovePermissionNotFoundException;
}
