import "../../utils/model.tsp";

using api.Utils.Model;

namespace api.Logout;

// ## LOGOUT ## //
@doc("logout input")
model LogoutInput {
  token: string;
}
