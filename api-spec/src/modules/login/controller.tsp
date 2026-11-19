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
  @doc("user login; opens a new session")
  @returnsDoc("login successfully")
  login(...VersionParams, @body login: LoginInput):
    | DefaultSuccessResponse<LoginOutput, 201>
    | LoginValidationError
    | LoginInvalidCredentialsError;

  @post
  @route("/refresh")
  @doc("""
    Exchanges a refresh token for a new access/refresh token pair (rotation).
    The refresh token sent stops working; always store the new one.
    """)
  @returnsDoc("new token pair")
  refresh(...VersionParams, @body login: RefreshTokenInput):
    | DefaultSuccessResponse<RefreshTokenOutput, 201>
    | RefreshValidationError
    | RefreshInvalidTokenError
    | RefreshNotFoundException;

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
