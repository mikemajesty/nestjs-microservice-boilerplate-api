namespace api.Login;

// ## LOGIN ## //
@doc("login input")
model LoginInput {
  email: string;
  password: string;
}

@doc("login ouput")
model LoginOutput {
  accessToken: string;
  refreshToken: string;
}

// ## REFRESH TOKEN ## //
@doc("login refresh token input")
model RefreshTokenInput {
  refreshToken: string;
}

@doc("login refresh token output")
model RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}
