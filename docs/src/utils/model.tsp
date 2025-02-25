import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Versioning;
using Utils.Versioning;

namespace api.Utils.Model;

using TypeSpec.Http;

model DefaultSuccessResponse<Body, Status extends int16> {
  @statusCode status: Status;
  @body body: Body;
}

@doc("document created successfully")
model ApiCreatedOutput {
  @doc("document id")
  id: string;

  @doc("conditional if document was created")
  created: boolean;
}

@doc("pagination default response")
model ApiPaginationOutput<T> {
  @doc("documents")
  docs: T[];

  @doc("current page")
  page: int32 = 1;

  @doc("limit per page")
  limit: int32 = 10;

  @doc("total items")
  total: int64 = 1;

  @doc("total pages")
  totalPages?: int32 = 1;
}

model ApiPaginationInput {
  @doc("pagination current page")
  @query
  page: int32 = 1;

  @doc("pagination limit per page")
  @query
  limit: int32 = 10;

  @doc("sort by property **property1:desc,property2:asc**")
  @query
  sort?: string = "createdAt:desc";

  @doc("search by property **property1:value1|value2**")
  @query
  search?: string;
}
