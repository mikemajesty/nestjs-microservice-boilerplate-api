namespace api.Login;

@doc("login input")
model LoginInput {
  email: string = "admin@admin.com";
  password: string = "admin";
}

@doc("login ouput")
model LoginOutput {
  accessToken: string;
  refreshToken: string;
}

@doc("login refresh token input")
model RefreshTokenInput {
  refreshToken: string;
}

@doc("login refresh token output")
model RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}
