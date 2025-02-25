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
  title: "User",
})
namespace api.User;

@tag("User")
@route("/api/{version}/users")
@useAuth(BearerAuth)
interface UserController {
  @post
  @doc("create user")
  @returnsDoc("user created successfully")
  create(...VersionParams, @body input: CreateInput):
    | DefaultSuccessResponse<CreateOutput, 201>
    | CreateNotFoundError
    | CreateConflictException
    | CreateValidationException;

  @put
  @doc("update user")
  @returnsDoc("user updated successfully")
  update(...VersionParams, ...UpdateParamsInput, @body input: UpdateInput):
    | DefaultSuccessResponse<UpdateOutput, 200>
    | UpdateNotFoundException
    | UpdateConflictException
    | UpdateValidationException;

  @get
  @doc("list user")
  @returnsDoc("user listed successfully")
  list(...VersionParams, ...ListQueryInput): DefaultSuccessResponse<ListOutput, 200>;

  @get
  @doc("list user")
  @returnsDoc("get user logged successfully")
  @route("me")
  me(...VersionParams): DefaultSuccessResponse<MeOutput, 200>;

  @get
  @doc("get user by id")
  @returnsDoc("get user by id successfully")
  getById(...VersionParams, ...GetByIdParamsInput): DefaultSuccessResponse<
    GetByIdOutput,
    200
  > | GetByIdUserNotFoundException | GetByIdValidationException;

  @put
  @doc("change password")
  @route("change-password")
  @returnsDoc("password updated successfully")
  changePassword(...VersionParams, ...ChangePasswordParamsInput, @body body: ChangePasswordInput):
    | DefaultSuccessResponse<void, 200>
    | ChangePasswordNotFoundException
    | ChangePasswordUserExistConflictError
    | ChangePasswordValidationException;

  @delete
  @doc("delete user")
  @returnsDoc("delete user successfully")
  delete(...VersionParams, ...DeleteParamsInput): DefaultSuccessResponse<
    DeleteOutput,
    200
  > | DeleteNotFoundException | DeleteValidationException;
}
