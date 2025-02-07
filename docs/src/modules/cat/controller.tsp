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
using Utils.Versions;

@service({
  title: "Cat",
})
@versioned(ApiVersions)
namespace api.Cat;

@tag("Cat")
@route("api/{version}/cats")
interface CatController {
  @post
  @doc("create cat")
  @returnsDoc("cat created successfully")
  create(@path version: ApiVersions, @body body: CreateInput): CreateOutput | CreateValidationException;

  @put
  @doc("create update")
  @returnsDoc("cat updated successfully")
  update(
    @path version: ApiVersions,
    ...UpdateParamInput,
    @body body: UpdateInput,
  ): UpdateOutput | UpdateValidationException | UpdateNotFoundException;

  @get
  @doc("get cat by id")
  @returnsDoc("get cat by id successfully")
  getById(
    @path version: ApiVersions,
    ...GetByIdParamInput,
  ): GetByIdOutput | GetByIdValidationException | GetByIdNotFoundException;

  @get
  @doc("list cat")
  @returnsDoc("list cat successfully")
  list(@path version: ApiVersions, ...ListQueryInput): ListOutput;

  @delete
  @doc("delete cat")
  @returnsDoc("cat deleted successfully")
  delete(
    @path version: ApiVersions,
    ...DeleteParamInput,
  ): DeleteOutput | DeleteValidationException | DeleteNotFoundException;
}
