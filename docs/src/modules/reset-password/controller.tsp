import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/versioning";
import "../../utils/exceptions.tsp";
import "../../utils/versioning.tsp";
import "../../utils/model.tsp";
import "./model.tsp";
import "./exception.tsp";

using api.Utils.Model;
using TypeSpec.Http;
using TypeSpec.Versioning;
using OpenAPI;
using Utils.Versioning;
using Utils.Exception;

@service({
  title: "Reset password",
})
namespace api.ResetPassword;

@tag("Reset password")
@route("/api/{version}/reset-password")
@useAuth(BearerAuth)
interface ResetPasswordController {
  @post
  @route("/send-email")
  @doc("send email")
  @returnsDoc("email sended successfully")
  sendEmail(...VersionParams, @body body: SendEmailInput): DefaultSuccessResponse<
    void,
    200
  > | SendEmailNotFoundException;

  @put
  @doc("reset password")
  @returnsDoc("password changed successfully")
  confirmResetPassword(...VersionParams, ...ConfirmResetPasswordParamsInput, @body body: ConfirmResetPasswordInput):
    | DefaultSuccessResponse<void, 200>
    | ConfirmResetPasswordBadRequestException
    | ConfirmResetPasswordNotFoundException
    | ConfirmResetPasswordUnauthorizedException;
}
