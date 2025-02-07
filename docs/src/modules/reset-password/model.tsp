import "../../utils/model.tsp";
import "@typespec/http";

using Utils.Model;
using TypeSpec.Http;

namespace api.ResetPassword;

@doc("reset password entity base")
model ResetPasswordEntity {
  token: string;
}

// ## SEND EMAIL ## //
@doc("reset password send email input")
model SendEmailInput {
  email: string;
}

// ## Confirm Reset Password ## //
@doc("confirm reset password input")
model ConfirmResetPasswordInput {
  password: string;
  token: string;
  confirmPassword: string;
}

@doc("confirm reset password params input")
model ConfirmResetPasswordParamsInput {
  @path
  @doc("user token")
  token: string;
}
