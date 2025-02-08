import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/versioning.tsp";
import "../../utils/exceptions.tsp";
import "./model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Versioning;
using Utils.Exception;
using Utils.Model;

@service({
  title: "Login",
})
namespace api.Login;

@tag("Login")
interface LoginController {
  @post
  @route("/api/{version}/login")
  @doc("user login")
  @returnsDoc("login successfully")
  login(...VersionParams, @body login: LoginInput): DefaultSuccessResponse<
    LoginOutput,
    200
  > | LoginNotFoundException | LoginInputException;

  @post
  @route("/api/{version}/refresh")
  @doc("get user refresh token")
  @returnsDoc("login refresh token successfully")
  refresh(...VersionParams, @body login: RefreshTokenInput): RefreshTokenOutput;

  @get
  @route("/api/{version}/login/google")
  loginGoogle(...VersionParams): void;

  @get
  @route("/api/{version}/login/google/callback")
  loginGoogleCallback(...VersionParams): void;
}
