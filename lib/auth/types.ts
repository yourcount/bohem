export type AdminRole = "EDITOR" | "ADMIN" | "SUPER_ADMIN";

export type AccountStatus = "active" | "suspended";

export type SessionPayload = {
  sub: "admin";
  sid: string;
  uid: number;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
};
