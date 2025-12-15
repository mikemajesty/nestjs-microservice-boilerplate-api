import "../../utils/model.tsp";
import "@typespec/http";

using TypeSpec.Http;

namespace api.ResetPassword;

@doc("reset password entity base")
model ResetPasswordEntity {
  token: string;
}

@doc("reset password send email input")
model SendEmailInput {
  email: string;
}

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
