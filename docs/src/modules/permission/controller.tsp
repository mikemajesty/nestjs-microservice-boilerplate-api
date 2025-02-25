import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/exceptions.tsp";
import "../../utils/versioning.tsp";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using Utils.Model;
using Utils.Versioning;
using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;

@service({
  title: "Permission",
})
namespace api.Permission;

@tag("Permission")
@route("/api/{version}/permissions")
@useAuth(BearerAuth)
interface PermissionController {
  @post
  @doc("create permission")
  @returnsDoc("permission created successfully")
  create(...VersionParams, @body body: CreateInput): CreateOutput | CreateValidationException | CreateConflictException;

  @put
  @doc("update permission")
  @returnsDoc("permission updated successfully")
  update(...VersionParams, ...UpdateParamsInput, @body body: UpdateInput):
    | UpdateOutput
    | UpdateValidationException
    | UpdateNotFoundException
    | UpdateConflictException;

  @get
  @doc("get permission")
  @returnsDoc("get permission successfully")
  getById(
    ...VersionParams,
    ...GetByIdParamsInput,
  ): GetByIdOutput | GetByIdValidationException | GeyByIdNotFoundException;

  @get
  @doc("list permission")
  @returnsDoc("list permission successfully")
  list(...VersionParams, ...ListQueryInput): ListOutput;

  @delete
  @doc("delete permission")
  @returnsDoc("delete permission successfully")
  delete(...VersionParams, ...DeleteParamsInput): DeleteOutput | DeleteValidationException | DeleteNotFoundException;
}
