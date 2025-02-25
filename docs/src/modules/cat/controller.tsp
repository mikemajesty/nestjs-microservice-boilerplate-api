import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Model;
using Utils.Versioning;

@service({
  title: "Cat",
})
namespace api.Cat;

@tag("Cat")
@route("api/{version}/cats")
@useAuth(BearerAuth)
interface CatController {
  @post
  @doc("create cat")
  @returnsDoc("cat created successfully")
  create(...VersionParams, @body body: CreateInput): CreateOutput | CreateValidationException;

  @put
  @doc("create update")
  @returnsDoc("cat updated successfully")
  update(
    ...VersionParams,
    ...UpdateParamInput,
    @body body: UpdateInput,
  ): UpdateOutput | UpdateValidationException | UpdateNotFoundException;

  @get
  @doc("get cat by id")
  @returnsDoc("get cat by id successfully")
  getById(
    ...VersionParams,
    ...GetByIdParamInput,
  ): GetByIdOutput | GetByIdValidationException | GetByIdNotFoundException;

  @get
  @doc("list cat")
  @returnsDoc("list cat successfully")
  list(...VersionParams, ...ListQueryInput): ListOutput;

  @delete
  @doc("delete cat")
  @returnsDoc("cat deleted successfully")
  delete(...VersionParams, ...DeleteParamInput): DeleteOutput | DeleteValidationException | DeleteNotFoundException;
}
