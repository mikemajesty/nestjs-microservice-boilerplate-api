import "../../utils/model.tsp";
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using Utils.Model;

namespace api.Cat;

@doc("cat base entity")
model CatEntity {
  name: string;
  breed: string;
  age: int16;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null = null;
}

@doc("cat create input")
model CreateInput extends PickProperties<CatEntity, "name" | "breed" | "age"> {}
@doc("cat create output")
model CreateOutput extends CatEntity {}

model UpdateParamInput {
  @doc("cat id")
  @path
  id: string;
}

@doc("cat update input")
model UpdateInput extends PickProperties<CatEntity, "name" | "breed" | "age"> {}
@doc("cat update output")
model UpdateOutput extends CatEntity {}

model GetByIdParamInput {
  @doc("cat id")
  @path
  id: string;
}
@doc("cat get by id input")
model GetByIdOutput extends CatEntity {}

model ListQueryInput extends ApiPaginationInput {}
@doc("cat list output")
model ListOutput extends ApiPaginationOutput<CatEntity> {}

model DeleteParamInput {
  @doc("cat id")
  @path
  id: string;
}
@doc("cat delete output")
model DeleteOutput extends OmitProperties<CatEntity, "deletedAt"> {
  deletedAt: utcDateTime;
}
