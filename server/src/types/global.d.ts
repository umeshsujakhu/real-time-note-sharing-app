import * as jwt from "jsonwebtoken";

declare module "jsonwebtoken" {
  interface JwtPayload {
    userId?: string;
    email?: string;
    role?: string;
  }
}
