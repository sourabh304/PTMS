export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface JwtAccessPayload {
  sub: string;
  org: string;
  role: string;
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
}
