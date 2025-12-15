import "../../utils/model.tsp";

namespace api.Logout;

@doc("logout input")
model LogoutInput {
  token: string;
}
