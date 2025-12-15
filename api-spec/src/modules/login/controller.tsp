import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/versioning.tsp";
import "../../utils/exceptions.tsp";
import "./model.tsp";
import "./exception.tsp";

using TypeSpec.Http;
using Utils.Versioning;
using Utils.Model;

@service(#{ title: "Login" })
namespace api.Login;

@tag("Login")
@route("api/{version}")
interface LoginController {
  @post
  @route("/login")
  @doc("user login")
  @returnsDoc("login successfully")
  login(...VersionParams, @body login: LoginInput): DefaultSuccessResponse<
    LoginOutput,
    200
  > | LoginNotFoundException | LoginInputException;

  @post
  @route("/refresh")
  @doc("get user refresh token")
  @returnsDoc("login refresh token successfully")
  refresh(...VersionParams, @body login: RefreshTokenInput): RefreshTokenOutput;

  @get
  @route("/login/google")
  @doc("Google OAuth login redirect")
  @returnsDoc("Redirects to Google OAuth")
  loginGoogle(...VersionParams): void;

  @get
  @route("/login/google/callback")
  @doc("Google OAuth callback")
  @returnsDoc("Handles Google OAuth callback")
  loginGoogleCallback(...VersionParams): void;
}
