import "../../utils/model.tsp";

namespace api.Alert;

@doc("Alert response model")
model AlertOutput {
  @doc("Status indicating alert was processed: **ok**")
  status: "ok";
}
