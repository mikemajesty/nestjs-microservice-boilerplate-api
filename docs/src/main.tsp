import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "./utils/versioning.tsp";
import "./modules/login/controller.tsp";
import "./modules/user/controller.tsp";
import "./modules/role/controller.tsp";
import "./modules/reset-password/controller.tsp";
import "./modules/permission/controller.tsp";
import "./modules/logout/controller.tsp";
import "./modules/health/controller.tsp";
import "./modules/cat/controller.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service(#{ title: "Microservice API" })
@server("http://localhost:5000/")
@versioned(api.Utils.Versioning.DocVersionVersion)
namespace api;
