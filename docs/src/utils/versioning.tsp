import "@typespec/http";

using TypeSpec.Http;

namespace api.Utils.Versions;

enum Versions {
  v1,
  v2,
}

model VersionParams {
  @doc("route version")
  @path
  version: Versions;
}
