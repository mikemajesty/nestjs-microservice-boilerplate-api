import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using Utils.Versioning;

@service(#{
  title: "Bird",
})
namespace api.Bird;

@tag("Bird")
@route("api/{version}/birds")
@useAuth(BearerAuth)
interface BirdController {
  @post
  @doc("create bird")
  @returnsDoc("bird created successfully")
  create(...VersionParams, @body body: CreateInput): CreateOutput | CreateValidationException;

  @put
  @doc("update bird")
  @returnsDoc("bird updated successfully")
  update(
    ...VersionParams,
    ...UpdateParamInput,
    @body body: UpdateInput,
  ): UpdateOutput | UpdateValidationException | UpdateNotFoundException;

  @get
  @doc("get bird by id")
  @returnsDoc("get bird by id successfully")
  getById(
    ...VersionParams,
    ...GetByIdParamInput,
  ): GetByIdOutput | GetByIdValidationException | GetByIdNotFoundException;

  @get
  @doc("list bird")
  @returnsDoc("list bird successfully")
  list(...VersionParams, ...ListQueryInput): ListOutput;

  @delete
  @doc("delete bird")
  @returnsDoc("bird deleted successfully")
  delete(...VersionParams, ...DeleteParamInput): DeleteOutput | DeleteValidationException | DeleteNotFoundException;
}
