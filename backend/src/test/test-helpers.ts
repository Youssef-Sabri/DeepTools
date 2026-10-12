import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const mockUser = {
  id: "a0000000-0000-0000-0000-000000000001",
  name: "Regular Seller User",
  email: "seller@example.com",
  role: "USER",
  tokenVersion: 0,
  deletedAt: null,
};

export const mockAdmin = {
  id: "b0000000-0000-0000-0000-000000000002",
  name: "Platform Admin",
  email: "admin@example.com",
  role: "ADMIN",
  tokenVersion: 0,
  deletedAt: null,
};

export const mockBuyer = {
  id: "c0000000-0000-0000-0000-000000000003",
  name: "Regular Buyer User",
  email: "buyer@example.com",
  role: "USER",
  tokenVersion: 0,
  deletedAt: null,
};

export function createToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: 0,
    },
    env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}
