import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

namespace api.Utils.Exception;

@doc("default error model")
model DefaultException<Status, Message> {
  @doc("status code")
  code: Status;

  @doc("request traceid")
  traceid: string;

  @doc("class that error occur")
  context: string;

  @doc("error message")
  message: Message[];

  @doc("timestamp that error occur")
  timestamp: string;

  @doc("path error")
  path: string;
}

@doc("default exception reponse")
model ApiErrorType<Status extends int16, Message extends string> {
  error: DefaultException<Status, Message>;
}

@doc("When resource not found.")
@error
model ApiNotFoundException<Message extends string> {
  ...ApiErrorType<404, Message>;
}

@doc("When input is invalid.")
@error
model ApiBadRequestException<Message extends string> {
  ...ApiErrorType<400, Message>;
}

@doc("When conflict occour.")
@error
model ApiConflictException<Message extends string> {
  ...ApiErrorType<409, Message>;
}

@doc("When unauthorized occour.")
@error
model ApiUnauthorizedException<Message extends string> {
  ...ApiErrorType<401, Message>;
}
