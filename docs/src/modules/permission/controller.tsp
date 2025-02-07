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

@service({
  title: "Permission",
})
namespace api.Permission;

@tag("Permission")
@route("/api/permissions")
interface PermissionController {
  @post
  @doc("create permission")
  @returnsDoc("permission created successfully")
  create(@body body: CreateInput): CreateOutput | CreateValidationException | CreateConflictException;

  @put
  @doc("update permission")
  @returnsDoc("permission updated successfully")
  update(...UpdateParamsInput, @body body: UpdateInput):
    | UpdateOutput
    | UpdateValidationException
    | UpdateNotFoundException
    | UpdateConflictException;

  @get
  @doc("get permission")
  @returnsDoc("get permission successfully")
  getById(...GetByIdParamsInput): GetByIdOutput | GetByIdValidationException | GeyByIdNotFoundException;

  @get
  @doc("list permission")
  @returnsDoc("list permission successfully")
  list(...ListQueryInput): ListOutput;

  @delete
  @doc("delete permission")
  @returnsDoc("delete permission successfully")
  delete(...DeleteParamsInput): DeleteOutput | DeleteValidationException | DeleteNotFoundException;
}
