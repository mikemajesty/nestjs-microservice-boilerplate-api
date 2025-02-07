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
using Utils.Versions;
using Utils.Exception;
using Utils.Model;

@service({
  title: "Login",
})
namespace api.Login;

@tag("Login")
interface LoginController {
  @post
  @route("/api/login")
  @doc("user login")
  @returnsDoc("login successfully")
  login(@body login: LoginInput): DefaultSuccessResponse<
    LoginOutput,
    200
  > | LoginNotFoundException | LoginInputException;

  @post
  @route("/api/refresh")
  @doc("get user refresh token")
  @returnsDoc("login refresh token successfully")
  refresh(@body login: RefreshTokenInput): RefreshTokenOutput;

  @get
  @route("/api/login/google")
  loginGoogle(): void;

  @get
  @route("/api/login/google/callback")
  loginGoogleCallback(): void;
}
