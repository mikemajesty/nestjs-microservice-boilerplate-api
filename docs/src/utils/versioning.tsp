import "@typespec/http";

using TypeSpec.Http;

namespace api.Utils.Versioning;

enum ApiVersion {
  v1,
}

enum DocVersionVersion {
  v1: "1.0",
}

model VersionParams {
  @doc("route version")
  @path
  version: ApiVersion;
}
